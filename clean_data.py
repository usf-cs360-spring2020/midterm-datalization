import pandas as pd 

df = pd.read_csv("~/Downloads/Fire_Department_Calls_for_Service-3.csv")

print(df.columns)

desired_cols = ["Call Date", "Call Type"]
relevant_df = df[desired_cols]

print(relevant_df.head(3))

relevant_df.to_csv("filtered_data.csv")

print("Done!")