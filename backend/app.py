
import os
import re
import uuid
from pathlib import Path

import pandas as pd
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename

from analyzer import analyze_dataset
from ai_service import answer_question
from preprocessing import (
    SUPPORTED_EXTENSIONS,
    clean_dataset,
    get_preview,
    load_dataset,
)
from report_generator import generate_pdf_report
from visualization import get_visualizations


BASE_DIR = Path(__file__).resolve().parent
UPLOAD_FOLDER = BASE_DIR / "uploads"
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

MAX_UPLOAD_BYTES = 20 * 1024 * 1024

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES
app.config["UPLOAD_FOLDER"] = str(UPLOAD_FOLDER)

# For local development, Vite normally runs on localhost:5173.
CORS(
    app,
    resources={r"/api/*": {"origins": [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]}},
)


def dataset_path(dataset_id):
    """Resolve only UUID-based dataset IDs inside the uploads directory."""
    try:
        uuid.UUID(dataset_id)
    except (ValueError, TypeError, AttributeError):
        return None

    matches = list(UPLOAD_FOLDER.glob(f"{dataset_id}.*"))
    return matches[0] if matches else None


def get_dataframe(dataset_id):
    path = dataset_path(dataset_id)

    if path is None or not path.is_file():
        return None

    return load_dataset(path)


def dataset_response(df, dataset_id):
    analysis = analyze_dataset(df)

    return {
        "dataset_id": dataset_id,
        "filename": dataset_id,
        "preview": get_preview(df, limit=10),
        "analysis": analysis,
        "metrics": analysis["metrics"],
        "charts": get_visualizations(df),
        "insights": analysis["insights"],
    }


@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "message": "AI Data Analytics backend is running.",
    })


@app.post("/api/upload")
def upload_dataset():
    if "file" not in request.files:
        return jsonify({"error": "No file was provided. Use the 'file' field."}), 400

    uploaded_file = request.files["file"]

    if not uploaded_file.filename:
        return jsonify({"error": "Please select a file."}), 400

    original_name = secure_filename(uploaded_file.filename)
    extension = Path(original_name).suffix.lower()

    if extension not in SUPPORTED_EXTENSIONS:
        return jsonify({
            "error": "Unsupported file. Upload CSV, XLSX, XLS, or JSON."
        }), 400

    dataset_id = str(uuid.uuid4())
    saved_path = UPLOAD_FOLDER / f"{dataset_id}{extension}"

    try:
        uploaded_file.save(saved_path)
        df = load_dataset(saved_path)

        return jsonify({
            **dataset_response(df, dataset_id),
            "original_filename": original_name,
        }), 201

    except (ValueError, pd.errors.ParserError, UnicodeError) as exc:
        saved_path.unlink(missing_ok=True)
        return jsonify({"error": f"Could not read dataset: {exc}"}), 400
    except Exception:
        saved_path.unlink(missing_ok=True)
        app.logger.exception("Dataset upload failed")
        return jsonify({"error": "Failed to process the uploaded dataset."}), 500


@app.get("/api/dataset/<dataset_id>")
def get_dataset(dataset_id):
    try:
        df = get_dataframe(dataset_id)

        if df is None:
            return jsonify({"error": "Dataset not found. Upload it again."}), 404

        return jsonify(dataset_response(df, dataset_id))
    except Exception:
        app.logger.exception("Dataset retrieval failed")
        return jsonify({"error": "Could not load the dataset."}), 500


@app.post("/api/analyze/<dataset_id>")
def analyze(dataset_id):
    try:
        df = get_dataframe(dataset_id)

        if df is None:
            return jsonify({"error": "Dataset not found."}), 404

        body = request.get_json(silent=True) or {}
        fill_missing = bool(body.get("fill_missing", False))
        remove_duplicates = bool(body.get("remove_duplicates", False))

        df = clean_dataset(
            df,
            fill_missing=fill_missing,
            remove_duplicates=remove_duplicates,
        )

        # Persist the cleaned dataset in its original supported format.
        path = dataset_path(dataset_id)
        extension = path.suffix.lower()

        if extension == ".csv":
            df.to_csv(path, index=False)
        elif extension in {".xlsx", ".xls"}:
            # Save as XLSX to avoid trying to write legacy XLS files.
            new_path = UPLOAD_FOLDER / f"{dataset_id}.xlsx"
            df.to_excel(new_path, index=False)
            if new_path != path:
                path.unlink(missing_ok=True)
        else:
            df.to_json(path, orient="records", force_ascii=False, date_format="iso")

        return jsonify(dataset_response(df, dataset_id))

    except Exception:
        app.logger.exception("Analysis failed")
        return jsonify({"error": "Could not analyze the dataset."}), 500


@app.post("/api/ask")
def ask_question():
    body = request.get_json(silent=True) or {}
    dataset_id = body.get("dataset_id")
    question = body.get("question", "")

    if not dataset_id:
        return jsonify({"error": "dataset_id is required."}), 400

    if not isinstance(question, str) or not question.strip():
        return jsonify({"error": "Please enter a question."}), 400

    try:
        df = get_dataframe(dataset_id)

        if df is None:
            return jsonify({"error": "Dataset not found."}), 404

        answer = answer_question(df, question.strip())

        return jsonify({
            "question": question.strip(),
            "answer": answer,
        })
    except Exception:
        app.logger.exception("Question answering failed")
        return jsonify({"error": "Could not answer this question."}), 500


@app.get("/api/report/<dataset_id>")
def download_report(dataset_id):
    try:
        df = get_dataframe(dataset_id)

        if df is None:
            return jsonify({"error": "Dataset not found."}), 404

        report = generate_pdf_report(df, "AI Data Analytics Report")

        return send_file(
            report,
            mimetype="application/pdf",
            as_attachment=True,
            download_name="analytics_report.pdf",
        )
    except Exception:
        app.logger.exception("Report generation failed")
        return jsonify({"error": "Could not generate the report."}), 500


@app.errorhandler(413)
def request_too_large(_error):
    return jsonify({
        "error": "File too large. Maximum upload size is 20 MB."
    }), 413


@app.errorhandler(404)
def not_found(_error):
    return jsonify({"error": "API endpoint not found."}), 404


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
