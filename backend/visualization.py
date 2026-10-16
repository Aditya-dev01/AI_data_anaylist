
import pandas as pd


def get_visualizations(df, max_categories=12):
    charts = []

    numeric_columns = list(
        df.select_dtypes(include="number").columns
    )
    categorical_columns = list(
        df.select_dtypes(exclude="number").columns
    )

    # Numerical distributions: useful for histograms or bar charts.
    for column in numeric_columns[:4]:
        values = pd.to_numeric(df[column], errors="coerce").dropna()

        if values.empty:
            continue

        bins = min(10, max(1, values.nunique()))

        if values.nunique() > 1:
            counts, edges = pd.cut(
                values, bins=bins, include_lowest=True, retbins=True
            ), None

            distribution = values.value_counts(
                bins=bins, sort=False
            ).sort_index()

            charts.append({
                "id": f"distribution_{column}",
                "title": f"Distribution of {column}",
                "type": "bar",
                "x_key": "range",
                "y_key": "count",
                "data": [
                    {"range": str(interval), "count": int(count)}
                    for interval, count in distribution.items()
                ],
            })

    # Category counts and category-level numeric totals.
    for category in categorical_columns[:3]:
        counts = df[category].fillna("Missing").astype(str).value_counts()
        counts = counts.head(max_categories)

        charts.append({
            "id": f"count_{category}",
            "title": f"Records by {category}",
            "type": "bar",
            "x_key": "label",
            "y_key": "value",
            "data": [
                {"label": str(label), "value": int(value)}
                for label, value in counts.items()
            ],
        })

        if numeric_columns:
            metric = numeric_columns[0]
            grouped = df.groupby(
                df[category].fillna("Missing").astype(str),
                dropna=False
            )[metric].sum(min_count=1)

            grouped = grouped.sort_values(ascending=False).head(
                max_categories
            )

            charts.append({
                "id": f"sum_{category}_{metric}",
                "title": f"{metric} by {category}",
                "type": "bar",
                "x_key": "label",
                "y_key": "value",
                "data": [
                    {
                        "label": str(label),
                        "value": (
                            None if pd.isna(value) else float(value)
                        ),
                    }
                    for label, value in grouped.items()
                ],
            })

    # Numeric correlation data for a scatter plot.
    if len(numeric_columns) >= 2:
        x_column, y_column = numeric_columns[:2]
        pairs = df[[x_column, y_column]].dropna().head(500)

        charts.append({
            "id": f"scatter_{x_column}_{y_column}",
            "title": f"{y_column} vs {x_column}",
            "type": "scatter",
            "x_key": str(x_column),
            "y_key": str(y_column),
            "data": [
                {str(x_column): float(row[x_column]),
                 str(y_column): float(row[y_column])}
                for _, row in pairs.iterrows()
            ],
        })

    return charts[:12]
