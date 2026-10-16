
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from analyzer import analyze_dataset


def generate_pdf_report(df, filename="Analytics Report"):
    analysis = analyze_dataset(df)
    output = BytesIO()

    document = SimpleDocTemplate(
        output,
        pagesize=A4,
        rightMargin=0.6 * inch,
        leftMargin=0.6 * inch,
        topMargin=0.6 * inch,
        bottomMargin=0.6 * inch,
    )

    styles = getSampleStyleSheet()
    story = [
        Paragraph(filename, styles["Title"]),
        Spacer(1, 12),
        Paragraph("Dataset Overview", styles["Heading2"]),
    ]

    metrics = analysis["metrics"]
    summary_rows = [
        ["Metric", "Value"],
        ["Rows", str(metrics["total_rows"])],
        ["Columns", str(metrics["total_columns"])],
        ["Numeric columns", str(metrics["numeric_columns"])],
        ["Categorical columns", str(metrics["categorical_columns"])],
        ["Missing cells", str(metrics["missing_cells"])],
        ["Duplicate rows", str(metrics["duplicate_rows"])],
    ]

    summary_table = Table(summary_rows, colWidths=[3 * inch, 2 * inch])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#263445")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("PADDING", (0, 0), (-1, -1), 7),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))

    story.extend([summary_table, Spacer(1, 18)])

    story.append(Paragraph("Numeric Statistics", styles["Heading2"]))

    stats_rows = [["Column", "Count", "Mean", "Min", "Max"]]
    for column, stats in analysis["numeric_stats"].items():
        stats_rows.append([
            str(column)[:40],
            str(stats["count"]),
            str(stats["mean"]),
            str(stats["min"]),
            str(stats["max"]),
        ])

    if len(stats_rows) == 1:
        stats_rows.append(["No numeric columns", "-", "-", "-", "-"])

    stats_table = Table(
        stats_rows,
        repeatRows=1,
        colWidths=[2.1 * inch, 0.8 * inch, 1.1 * inch, 1 * inch, 1 * inch],
    )
    stats_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#263445")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("PADDING", (0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))

    story.extend([stats_table, Spacer(1, 18)])
    story.append(Paragraph("Insights", styles["Heading2"]))

    for insight in analysis["insights"][:15]:
        story.append(Paragraph(f"• {insight}", styles["BodyText"]))
        story.append(Spacer(1, 5))

    document.build(story)
    output.seek(0)
    return output
