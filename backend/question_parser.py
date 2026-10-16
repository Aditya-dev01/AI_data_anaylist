
import re


def parse_question(question, columns):
    text = question.lower().strip()

    if not text:
        return {"intent": "unknown", "column": None}

    def normalize(value):
        return re.sub(r"[^a-z0-9]+", " ", str(value).lower()).strip()

    normalized_text = normalize(text)

    # Match the longest column names first.
    normalized_columns = sorted(
        [
            (normalize(column), column)
            for column in columns
            if normalize(column)
        ],
        key=lambda item: len(item[0]),
        reverse=True,
    )

    matched_column = None

    for normalized_name, original_name in normalized_columns:
        pattern = r"(?<!\w)" + re.escape(normalized_name) + r"(?!\w)"
        if re.search(pattern, normalized_text):
            matched_column = original_name
            break

    # Detect specific dataset-wide questions first.
    if any(word in normalized_text for word in (
        "how many rows", "row count", "number of rows", "number of records"
    )):
        intent = "row_count"

    elif any(word in normalized_text for word in (
        "how many columns", "column count", "number of columns"
    )):
        intent = "column_count"

    elif any(word in normalized_text for word in (
        "missing", "null", "empty", "blank"
    )):
        intent = "missing"

    elif any(word in normalized_text for word in (
        "duplicate", "repeated rows"
    )):
        intent = "duplicates"

    elif any(word in normalized_text for word in (
        "correlation", "correlate", "relationship"
    )):
        intent = "correlation"

    elif any(word in normalized_text for word in (
        "average", "mean"
    )):
        intent = "mean"

    elif "median" in normalized_text:
        intent = "median"

    elif any(word in normalized_text for word in (
        "maximum", "highest", "largest"
    )):
        intent = "max"

    elif any(word in normalized_text for word in (
        "minimum", "lowest", "smallest", "least"
    )):
        intent = "min"

    elif any(word in normalized_text for word in (
        "total", "sum", "overall"
    )):
        intent = "sum"

    elif any(word in normalized_text for word in (
        "describe", "summary", "statistics", "stats"
    )):
        intent = "summary"

    elif any(word in normalized_text for word in (
        "top", "best", "most frequent", "group by", "breakdown"
    )):
        intent = "top"

    else:
        intent = "unknown"

    return {"intent": intent, "column": matched_column}
