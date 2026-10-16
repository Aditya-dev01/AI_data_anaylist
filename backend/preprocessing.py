
import json
from pathlib import Path

import pandas as pd


SUPPORTED_EXTENSIONS = {".csv", ".xlsx", ".xls", ".json"}


def load_dataset(file_path):
    """Load a supported data file into a pandas DataFrame."""
    path = Path(file_path)
    extension = path.suffix.lower()

    if extension == ".csv":
        try:
            df = pd.read_csv(path, encoding="utf-8-sig")
        except UnicodeDecodeError:
            df = pd.read_csv(path, encoding="latin-1")
    elif extension in {".xlsx", ".xls"}:
        df = pd.read_excel(path)
    elif extension == ".json":
        with path.open("r", encoding="utf-8") as file:
            data = json.load(file)

        if isinstance(data, list):
            df = pd.DataFrame(data)
        elif isinstance(data, dict):
            df = pd.json_normalize(data)
        else:
            raise ValueError("JSON must contain an array of records or an object.")
    else:
        raise ValueError("Unsupported file type.")

    if df.empty:
        raise ValueError("The uploaded dataset is empty.")

    if len(df.columns) == 0:
        raise ValueError("The dataset has no columns.")

    # Remove surrounding spaces from column names.
    df.columns = [str(column).strip() for column in df.columns]

    # Replace blank strings with missing values.
    df = df.replace(r"^\s*$", pd.NA, regex=True)

    # Remove completely empty rows and columns.
    df = df.dropna(how="all").dropna(axis=1, how="all")

    if df.empty or len(df.columns) == 0:
        raise ValueError("No usable data was found in the file.")

    return df


def clean_dataset(df, fill_missing=False, remove_duplicates=False):
    """Return a cleaned copy of a DataFrame."""
    cleaned = df.copy()

    if remove_duplicates:
        cleaned = cleaned.drop_duplicates()

    if fill_missing:
        for column in cleaned.columns:
            if pd.api.types.is_numeric_dtype(cleaned[column]):
                median = cleaned[column].median()
                if pd.notna(median):
                    cleaned[column] = cleaned[column].fillna(median)
            else:
                mode = cleaned[column].mode(dropna=True)
                if not mode.empty:
                    cleaned[column] = cleaned[column].fillna(mode.iloc[0])

    return cleaned


def get_preview(df, limit=10):
    """Return JSON-compatible rows and column names."""
    preview = df.head(limit).copy()
    preview = preview.astype(object).where(pd.notna(preview), None)

    return {
        "columns": [str(column) for column in df.columns],
        "rows": preview.to_dict(orient="records"),
        "total_rows": int(len(df)),
        "total_columns": int(len(df.columns)),
    }
