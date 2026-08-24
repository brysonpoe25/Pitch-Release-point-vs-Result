"""
FinchField Pitch Tracking — EDA Explorer
A Streamlit app exploring how pitch RELEASE POINT relates to pitch RESULT,
using a TrackMan pitch-by-pitch dataset from a college baseball game
at FinchField (2025-06-09, CPL).
"""

import matplotlib.pyplot as plt
import pandas as pd
import plotly.express as px
import seaborn as sns
import streamlit as st

# ---------------------------------------------------------------------------
# Page config
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title="FinchField Pitch Tracking — EDA Explorer",
    page_icon="⚾",
    layout="wide",
)

DATA_PATH = "data/pitch_data.csv"

KEEP_COLS = [
    "PitchNo", "Date", "Time", "Inning", "Top/Bottom", "Outs", "Balls", "Strikes",
    "Pitcher", "PitcherThrows", "PitcherTeam",
    "Batter", "BatterSide", "BatterTeam",
    "TaggedPitchType", "AutoPitchType", "PitchCall", "KorBB", "PlayResult",
    "RelSpeed", "SpinRate", "InducedVertBreak", "HorzBreak",
    "RelHeight", "RelSide", "Extension",
    "PlateLocHeight", "PlateLocSide",
    "ExitSpeed", "Angle", "Distance",
]


def classify_outcome(row) -> str:
    """Collapse PitchCall/PlayResult into a small set of readable outcome buckets."""
    call = row["PitchCall"]
    if call == "BallCalled":
        return "Ball"
    if call == "StrikeCalled":
        return "Called Strike"
    if call == "StrikeSwinging":
        return "Swinging Strike"
    if call in ("FoulBallNotFieldable", "FoulBallFieldable"):
        return "Foul"
    if call == "HitByPitch":
        return "Hit By Pitch"
    if call == "InPlay":
        result = row["PlayResult"]
        if result in ("Single", "Double", "Triple", "HomeRun"):
            return "In Play: Hit"
        if result == "Out":
            return "In Play: Out"
        return "In Play: Other"
    return "Other"


OUTCOME_ORDER = [
    "Ball", "Called Strike", "Swinging Strike", "Foul", "Hit By Pitch",
    "In Play: Out", "In Play: Hit", "In Play: Other",
]
OUTCOME_COLORS = {
    "Ball": "#8ecae6",
    "Called Strike": "#219ebc",
    "Swinging Strike": "#023047",
    "Foul": "#ffb703",
    "Hit By Pitch": "#e76f51",
    "In Play: Out": "#6c757d",
    "In Play: Hit": "#2a9d8f",
    "In Play: Other": "#adb5bd",
}


@st.cache_data
def load_data(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    df = df[[c for c in KEEP_COLS if c in df.columns]].copy()
    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
    df["Outcome"] = df.apply(classify_outcome, axis=1)
    return df


df = load_data(DATA_PATH)

# ---------------------------------------------------------------------------
# Sidebar — filters
# ---------------------------------------------------------------------------
st.sidebar.header("Filters")

pitchers = sorted(df["Pitcher"].dropna().unique())
selected_pitchers = st.sidebar.multiselect("Pitcher", pitchers, default=pitchers)

pitch_types = sorted(df["TaggedPitchType"].dropna().unique())
selected_pitch_types = st.sidebar.multiselect("Pitch Type", pitch_types, default=pitch_types)

outcomes_present = [o for o in OUTCOME_ORDER if o in df["Outcome"].unique()]
selected_outcomes = st.sidebar.multiselect("Outcome", outcomes_present, default=outcomes_present)

filtered = df[
    df["Pitcher"].isin(selected_pitchers)
    & df["TaggedPitchType"].isin(selected_pitch_types)
    & df["Outcome"].isin(selected_outcomes)
]

st.sidebar.markdown("---")
st.sidebar.caption(
    "Data: TrackMan pitch-by-pitch export, FinchField, 2025-06-09 (CPL). "
    "Unverified game feed — for educational EDA purposes only."
)

# ---------------------------------------------------------------------------
# Header
# ---------------------------------------------------------------------------
st.title("⚾ FinchField Pitch Tracking — EDA Explorer")
st.markdown(
    "**Central question: does *where* a pitcher releases the ball relate to "
    "*what happens* to the pitch?** This app explores release point "
    "(height, side, extension) against pitch outcomes for a college "
    "baseball game at FinchField on **June 9, 2025**. Use the sidebar to "
    "filter by pitcher, pitch type, and outcome."
)

st.markdown("---")

# ---------------------------------------------------------------------------
# Section 1 — Dataset overview
# ---------------------------------------------------------------------------
st.header("1. Dataset Overview")

c1, c2, c3, c4 = st.columns(4)
c1.metric("Pitches (filtered)", f"{len(filtered):,}")
c2.metric("Pitchers", filtered["Pitcher"].nunique())
c3.metric("Batters faced", filtered["Batter"].nunique())
c4.metric("Pitch types", filtered["TaggedPitchType"].nunique())

with st.expander("Preview raw data"):
    st.dataframe(filtered.head(20), use_container_width=True)

with st.expander("Column data types"):
    st.dataframe(
        filtered.dtypes.astype(str).rename("dtype").reset_index().rename(columns={"index": "column"}),
        use_container_width=True,
        hide_index=True,
    )

with st.expander("Missing values"):
    missing = filtered.isna().mean().mul(100).round(1).rename("missing %")
    st.dataframe(missing[missing > 0].reset_index().rename(columns={"index": "column"}), use_container_width=True, hide_index=True)

with st.expander("Summary statistics (numeric columns)"):
    numeric_cols = ["RelSpeed", "SpinRate", "RelHeight", "RelSide", "Extension", "PlateLocHeight", "PlateLocSide", "ExitSpeed", "Angle", "Distance"]
    st.dataframe(filtered[numeric_cols].describe().round(2), use_container_width=True)

st.markdown("---")

# ---------------------------------------------------------------------------
# Section 2 — Release point landscape
# ---------------------------------------------------------------------------
st.header("2. Release Point Landscape")
st.markdown(
    "Where each pitcher lets go of the ball, from the catcher's perspective. "
    "Tight clusters indicate a repeatable release; spread indicates variability "
    "across pitch types or arm slots."
)

col1, col2 = st.columns(2)

with col1:
    fig_rel_pitcher = px.scatter(
        filtered, x="RelSide", y="RelHeight", color="Pitcher",
        hover_data=["TaggedPitchType", "RelSpeed"],
        labels={"RelSide": "Release Side (ft, catcher's view)", "RelHeight": "Release Height (ft)"},
        title="Release Point by Pitcher",
    )
    fig_rel_pitcher.update_yaxes(scaleanchor="x", scaleratio=1)
    st.plotly_chart(fig_rel_pitcher, use_container_width=True)

with col2:
    fig_rel_type = px.scatter(
        filtered, x="RelSide", y="RelHeight", color="TaggedPitchType",
        hover_data=["Pitcher", "RelSpeed"],
        labels={"RelSide": "Release Side (ft, catcher's view)", "RelHeight": "Release Height (ft)"},
        title="Release Point by Pitch Type",
    )
    st.plotly_chart(fig_rel_type, use_container_width=True)

st.markdown("---")

# ---------------------------------------------------------------------------
# Section 3 — Release point vs. outcome (the core analysis)
# ---------------------------------------------------------------------------
st.header("3. Release Point vs. Pitch Outcome")
st.markdown(
    "Each point is one pitch, positioned by its release point and colored by "
    "what happened. Look for outcome colors clustering in different regions — "
    "that would suggest release point influences results."
)

palette = {k: v for k, v in OUTCOME_COLORS.items() if k in filtered["Outcome"].unique()}

fig_rel_outcome = px.scatter(
    filtered, x="RelSide", y="RelHeight", color="Outcome",
    category_orders={"Outcome": outcomes_present},
    color_discrete_map=palette,
    hover_data=["Pitcher", "TaggedPitchType", "RelSpeed", "PlateLocHeight", "PlateLocSide"],
    labels={"RelSide": "Release Side (ft, catcher's view)", "RelHeight": "Release Height (ft)"},
    title="Release Point Colored by Outcome",
)
fig_rel_outcome.update_yaxes(scaleanchor="x", scaleratio=1)
st.plotly_chart(fig_rel_outcome, use_container_width=True)

col1, col2 = st.columns(2)
with col1:
    fig_box_height = px.box(
        filtered, x="Outcome", y="RelHeight", color="Outcome",
        category_orders={"Outcome": outcomes_present},
        color_discrete_map=palette,
        points="all",
        title="Release Height by Outcome",
        labels={"RelHeight": "Release Height (ft)"},
    )
    fig_box_height.update_layout(showlegend=False, xaxis_tickangle=-30)
    st.plotly_chart(fig_box_height, use_container_width=True)

with col2:
    fig_box_side = px.box(
        filtered, x="Outcome", y="RelSide", color="Outcome",
        category_orders={"Outcome": outcomes_present},
        color_discrete_map=palette,
        points="all",
        title="Release Side by Outcome",
        labels={"RelSide": "Release Side (ft)"},
    )
    fig_box_side.update_layout(showlegend=False, xaxis_tickangle=-30)
    st.plotly_chart(fig_box_side, use_container_width=True)

with st.expander("Average release point & extension by outcome (table)"):
    summary = (
        filtered.groupby("Outcome")[["RelHeight", "RelSide", "Extension"]]
        .mean()
        .round(2)
        .reindex([o for o in outcomes_present if o in filtered["Outcome"].unique()])
    )
    counts = filtered["Outcome"].value_counts().rename("Pitches")
    st.dataframe(summary.join(counts), use_container_width=True)

st.markdown("##### Extension vs. Contact Quality")
st.markdown(
    "For balls put in play, does releasing the ball closer to the plate "
    "(more extension) relate to weaker or stronger contact (exit speed)?"
)
in_play = filtered[filtered["PitchCall"] == "InPlay"].dropna(subset=["ExitSpeed"])
if len(in_play) > 0:
    fig_ext = px.scatter(
        in_play, x="Extension", y="ExitSpeed", color="PlayResult",
        hover_data=["Pitcher", "TaggedPitchType"],
        labels={"Extension": "Release Extension (ft)", "ExitSpeed": "Exit Speed (mph)"},
        title="Release Extension vs. Exit Speed (balls in play)",
        trendline="ols" if len(in_play) > 1 else None,
    )
    st.plotly_chart(fig_ext, use_container_width=True)
else:
    st.info("No balls in play with recorded exit speed in the current filter selection.")

st.markdown("---")

# ---------------------------------------------------------------------------
# Section 4 — Supporting context: velocity, movement, spin
# ---------------------------------------------------------------------------
st.header("4. Supporting Context: Velocity, Movement & Spin")

col1, col2 = st.columns(2)

with col1:
    fig_hist = px.histogram(
        filtered, x="RelSpeed", color="TaggedPitchType", nbins=30,
        title="Release Speed Distribution by Pitch Type",
        labels={"RelSpeed": "Release Speed (mph)"},
    )
    st.plotly_chart(fig_hist, use_container_width=True)

with col2:
    fig_move = px.scatter(
        filtered, x="HorzBreak", y="InducedVertBreak", color="TaggedPitchType",
        hover_data=["Pitcher", "RelSpeed", "SpinRate"],
        labels={"HorzBreak": "Horizontal Break (in)", "InducedVertBreak": "Induced Vertical Break (in)"},
        title="Pitch Movement by Type",
    )
    fig_move.add_hline(y=0, line_dash="dot", line_color="gray")
    fig_move.add_vline(x=0, line_dash="dot", line_color="gray")
    st.plotly_chart(fig_move, use_container_width=True)

fig_spin = px.scatter(
    filtered, x="RelSpeed", y="SpinRate", color="TaggedPitchType",
    trendline="ols" if len(filtered) > 1 else None,
    hover_data=["Pitcher"],
    labels={"RelSpeed": "Release Speed (mph)", "SpinRate": "Spin Rate (rpm)"},
    title="Spin Rate vs. Release Speed",
)
st.plotly_chart(fig_spin, use_container_width=True)

st.markdown("---")

# ---------------------------------------------------------------------------
# Section 5 — Strike zone location (matplotlib/seaborn)
# ---------------------------------------------------------------------------
st.header("5. Pitch Location in the Strike Zone")
st.markdown(
    "Catcher's-eye view of pitch locations. The dashed box is an approximate "
    "rulebook strike zone (17in plate, ~1.5–3.5 ft vertically)."
)

fig, ax = plt.subplots(figsize=(6, 6))
sns.scatterplot(
    data=filtered, x="PlateLocSide", y="PlateLocHeight",
    hue="Outcome", hue_order=[o for o in outcomes_present if o in filtered["Outcome"].unique()],
    palette=palette, alpha=0.8, ax=ax,
)
zone_left, zone_right = -0.83, 0.83
zone_bottom, zone_top = 1.5, 3.5
ax.plot(
    [zone_left, zone_right, zone_right, zone_left, zone_left],
    [zone_bottom, zone_bottom, zone_top, zone_top, zone_bottom],
    linestyle="--", color="black", linewidth=1.5,
)
ax.set_xlabel("Plate Side (ft, catcher's view)")
ax.set_ylabel("Plate Height (ft)")
ax.set_title("Pitch Locations vs. Strike Zone, Colored by Outcome")
ax.set_xlim(-3, 3)
ax.set_ylim(0, 5)
ax.legend(bbox_to_anchor=(1.05, 1), loc="upper left", fontsize=8)
st.pyplot(fig)

st.markdown("---")
st.caption("Built with Streamlit, pandas, matplotlib, seaborn, and plotly.")
