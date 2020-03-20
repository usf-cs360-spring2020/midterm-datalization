import pandas as pd 



def group_calls(row):
	call_name = row["Call Type"]
	res = ""

	if call_name in ["Medical Incident"]:
		res = "Medical"

	elif call_name in ["Electrical Hazard", "Fuel Spill", "Gas Leak (Natural and LP Gases)", "HazMat", "Odor (Strange / Unknown)", "Oil Spill", "Smoke Investigation (Outside)", "Suspicious Package"]:
		res = "Chemical / Electrical"

	elif call_name in ["Confined Space / Structure Collapse", "Elevator / Escalator Rescue", "Extrication / Entrapped (Machinery, Vehicle)", "High Angle Rescue", "Water Rescue"]:
		res = "Rescue"

	elif call_name in ["Assist Police", "Citizen Assist / Service Call", "Mutual Aid / Assist Outside Agency"]:
		res = "Aid Other Agency"

	elif call_name in ["Alarms", "Explosion", "Marine Fire", "Outside Fire", "Vehicle Fire", "Structure Fire", "Train / Rail Fire"]:
		res = "Fire"

	elif call_name in ["Aircraft Emergency", "Industrial Accidents", "Lightning Strike (Investigation)", "Traffic Collision", "Train / Rail Incident", "Watercraft in Distress"]:
		res = "Misc Emergency"

	elif call_name in ["Administrative", "Other"]:
		res = "Various Other"

	else:
		print("Got invalid call type name, something is very wrong: {}".format(call_name))


	return res


def main():
	# Obviously file location is based on my local system
	print("Started")
	df = pd.read_csv("~/Downloads/Fire_Department_Calls_for_Service-2.csv")

	# Splits the call type into custom groupings that I created
	print("Grouping")
	relevant_df = df[["Call Date", "Call Type"]]
	relevant_df["Custom Grouping"] = relevant_df.apply(group_calls, axis=1)
	relevant_df = relevant_df[["Call Date", "Custom Grouping"]]

	# This is where the magic happens. It groups by the desired columns (date and call type), 
	# and gets the count of each call type. It then returns it as a df. 
	print("Getting Counts")
	final_df = relevant_df.groupby( ["Call Date", "Custom Grouping"]).size().unstack(fill_value=0).reset_index()

	print(final_df.head(3))
	final_df.to_csv("granger_grouped_data.csv", index=False)

	print("Done!")


if __name__ == '__main__':
	main()

