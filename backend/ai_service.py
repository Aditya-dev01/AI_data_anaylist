
from analyzer import analyze_dataset
from question_parser import parse_question


def answer_question(df, question):
    parsed = parse_question(question, df.columns)
    intent = parsed["intent"]
    column = parsed["column"]

    if intent == "row_count":
        return f"The dataset contains {len(df):,} rows."

    if intent == "column_count":
        return f"The dataset contains {len(df.columns)} columns: " + ", ".join(
            map(str, df.columns)
        )

    if intent == "missing":
        total = int(df.isna().sum().sum())
        details = df.isna().sum()
        nonzero = details[details > 0].to_dict()

        if not total:
            return "There are no missing cells in the dataset."

        return (
            f"There are {total} missing cells. "
            f"By column: {nonzero}."
        )

    if intent == "duplicates":
        return f"The dataset contains {int(df.duplicated().sum())} duplicate rows."

    if intent == "correlation":
        result = analyze_dataset(df)["correlations"]
        if not result:
            return "At least two numeric columns are required to calculate correlations."

        strongest = sorted(
            result.items(), key=lambda item: abs(item[1]), reverse=True
        )
        return "Numeric correlations (from -1 to 1): " + "; ".join(
            f"{pair}: {value}" for pair, value in strongest[:5]
        )

    if intent == "summary":
        result = analyze_dataset(df)
        return (
            f"Dataset summary: {len(df)} rows, {len(df.columns)} columns, "
            f"{result['metrics']['missing_cells']} missing cells, and "
            f"{result['metrics']['duplicate_rows']} duplicate rows. "
            f"Numeric columns: {', '.join(result['numeric_stats'].keys()) or 'none'}."
        )

    if column is None:
        return (
            "I couldn't identify a specific column in that question. "
            "Try naming a column, for example: "
            "'What is the average Revenue?' Available columns: "
            + ", ".join(map(str, df.columns))
        )

    if intent in {"mean", "median", "sum", "max", "min"}:
        series = df[column]

        if not __import__("pandas").api.types.is_numeric_dtype(series):
            return f"'{column}' is not a numeric column, so this calculation is not supported."

        series = series.dropna()

        if series.empty:
            return f"Column '{column}' has no numeric values to analyze."

        operations = {
            "mean": series.mean,
            "median": series.median,
            "sum": series.sum,
            "max": series.max,
            "min": series.min,
        }
        result = operations[intent]()

        return f"{intent.title()} of {column} is {result:,.4f}."

    if intent == "top":
        if __import__("pandas").api.types.is_numeric_dtype(df[column]):
            return (
                f"The highest value in {column} is "
                f"{df[column].max():,.4f}."
            )

        counts = df[column].fillna("Missing").astype(str).value_counts().head(5)
        return "Most frequent values in " + column + ": " + ", ".join(
            f"{name} ({count})" for name, count in counts.items()
        )

    return (
        "I can answer questions about row counts, column counts, averages, "
        "totals, minimums, maximums, missing values, duplicates, correlations, "
        "and frequent categories. Try asking about a specific column. "
        "Available columns: " + ", ".join(map(str, df.columns))
    )
