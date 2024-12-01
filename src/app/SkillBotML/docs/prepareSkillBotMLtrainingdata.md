# Preparing the Training Data

> **Note**: A previous list of `skill_name` and `skill_category` values was included in the dataset preparation. However, these values were somewhat arbitrary and require validation within the WannaGonna team to ensure consistency and alignment with the organization's objectives.

---

To prepare the training data for the selected range of rows and columns in the dataset, the following steps were taken:

## Step 1: Initial Dataset Inspection

- The dataset contained columns for skill attributes: `skill_name`, `skill_category`, `skill_complexity`, `skill_impact_score`, and other fields.
- Additional fields (`skill_wg_credits` and `skill_experience_points`) were synthesized based on logical rules and existing fields (`skill_complexity` and `skill_impact_score`).

## Step 2: Data Augmentation

- **`skill_wg_credits`**: Simulated as a function of:
  - **Complexity**: Weighting based on numerical complexity values.
  - **Impact Score**: Scaled influence of impact scores.
- **`skill_experience_points`**: Augmented with:
  - Complexity and impact-based calculations.
  - Randomness to simulate natural variation.

## Step 3: Value Normalization

To ensure uniformity across datasets:

- `skill_complexity` scaled between 1 and 5.
- `skill_impact_score` scaled between 1 and 10.
- `skill_wg_credits` and `skill_experience_points` normalized to range from 1 to 100.

## Step 4: Verification

- Data integrity and value ranges were verified by checking min/max values.
- The final re-normalized dataset was reviewed and saved for model training.

---

This prepared dataset ensures that machine learning models can effectively learn patterns and relationships across these variables for predictive tasks. Validation of skill names and categories with the WannaGonna team remains a critical next step.
