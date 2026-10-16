
import pandas as pd


def _number(value):
    """Convert pandas/numpy values into JSON-friendly numbers."""
    if pd.isna(value):
        return None

    result = float(value)
    if result.is_integer():
        return int(result)

    return round(result, 4)


def analyze_dataset(df):
    numeric = df.select_dtypes(include="number")
    categorical = df.select_dtypes(exclude="number")

    missing_by_column = df.isna().sum().to_dict()

    metrics = {
        "total_rows": int(len(df)),
        "total_columns": int(len(df.columns)),
        "numeric_columns": int(len(numeric.columns)),
        "categorical_columns": int(len(categorical.columns)),
        "missing_cells": int(df.isna().sum().sum()),
        "duplicate_rows": int(df.duplicated().sum()),
        "memory_usage_bytes": int(df.memory_usage(deep=True).sum()),
    }

    numeric_stats = {}
    for column in numeric.columns:
        series = numeric[column].dropna()
        numeric_stats[str(column)] = {
            "count": int(series.count()),
            "sum": _number(series.sum()) if not series.empty else None,
            "mean": _number(series.mean()) if not series.empty else None,
            "median": _number(series.median()) if not series.empty else None,
            "min": _number(series.min()) if not series.empty else None,
            "max": _number(series.max()) if not series.empty else None,
            "std": _number(series.std()) if len(series) > 1 else None,
        }

    categorical_stats = {}
    for column in categorical.columns:
        values = df[column].dropna().astype(str)
        counts = values.value_counts()

        categorical_stats[str(column)] = {
            "unique_values": int(values.nunique()),
            "top_value": str(counts.index[0]) if not counts.empty else None,
            "top_count": int(counts.iloc[0]) if not counts.empty else 0,
        }

    insights = []

    if metrics["missing_cells"]:
        insights.append(
            f"The dataset contains {metrics['missing_cells']} missing cells."
        )
    else:
        insights.append("No missing cells were found in the dataset.")

    if metrics["duplicate_rows"]:
        insights.append(
            f"{metrics['duplicate_rows']} duplicate rows could be reviewed."
        )

    for column, stats in numeric_stats.items():
        if stats["max"] is not None:
            insights.append(
                f"{column}: average {stats['mean']}, minimum {stats['min']}, "
                f"maximum {stats['max']}."
            )

    for column, stats in categorical_stats.items():
        if stats["top_value"] is not None:
            insights.append(
                f"Most frequent {column}: {stats['top_value']} "
                f"({stats['top_count']} rows)."
            )

    correlations = {}
    if len(numeric.columns) >= 2:
        corr = numeric.corr(numeric_only=True)
        for first in corr.columns:
            for second in corr.columns:
                if first < second:
                    value = corr.loc[first, second]
                    if pd.notna(value):
                        correlations[f"{first} vs {second}"] = round(
                            float(value), 4
                        )

    return {
        "metrics": metrics,
        "numeric_stats": numeric_stats,
        "categorical_stats": categorical_stats,
        "missing_by_column": {
            str(key): int(value)
            for key, value in missing_by_column.items()
        },
        "correlations": correlations,
        "insights": insights[:30],
    }
