---
layout: post
title:  "Concurrency control and transaction logging with NPoco"
date:   2015-10-15 14:32:57 -0500
categories: npoco database
---
I've been happy with using a _micro-ORM_ like [NPoco][npoco] for database persistence, but an ERP record keeping project may require logging and concurrency control.  We can't have a user update a record with old data that's just been updated by another user now can we?

It's super convenient that the [NPoco][npoco] library will update the appropriate database table automatically.  We just need to add a log entry in the database, and roll back everything if logging fails. First lets check the timestamp on the record before updating it.

{% highlight c# %}
private readonly Database db = new Database("SpaceDB");

public int UpdateRecord(ClientRecord obj, int userId)
{
	var _ReturnResult = 0;
	var _ActionResult = 0;

	try
	{
		db.BeginTransaction();

		// Check record for concurrent updates
		var _Record = db.SingleById<ClientRecord>(obj.ClientRecordId);

		if (obj.UpdateDate.Equals(_Record.UpdateDate))
		{
			obj.UpdateDate = DateTime.Now;
			obj.UpdateBy = userId;

			_ActionResult = db.Update(obj);
			LogEntry.Log("UPDATE", db, obj;
		}

		// Commit transaction
		if (_ActionResult == 1)
		{
			db.CompleteTransaction();
			_ReturnResult = 1;
		}
		else
		{
			db.AbortTransaction();
		}
	}
	catch (Exception ex)
	{
		db.AbortTransaction();
	}

	return _ReturnResult;
}
{% endhighlight %}

First the code gets the most recent update timestamp from the database to check that it has not been touched since our client loaded it. If so, we're clear to update the record.  We use [NPoco][npoco] to update the table corresponding to the ClientRecord class, and log the update. Below is the the code for `LogEntry.Log`.

Since `_ActionResult` contains the number of updated rows returned from [NPoco][npoco], we can expect that to be `1`. Otherwise there was a problem, and any changes applied need to be removed from the database.  All of this is done inside of a transaction, so anything fails, just use `AbortTransaction()` to roll back everything. In this case a `1` is returned from the `UpdateRecord` method only if the update transaction was successful.

{% highlight c# %}
public class LogEntry
{
/// <summary>
/// Writes an entry to the log table. Throws an exception if not successful.
/// </summary>
/// <param name="db">Instance of the NPoco database used for the transaction.</param>
/// <param name="obj">POCO class object being saved in the database.</param>
public static void Log(String SQLAction, Database db, System.Object obj)
{
	var _LogEntry = new Log();

	// Use reflection to get values from object by name - update date and by are required
	_LogEntry.UpdateDate = (DateTime) obj.GetType().GetProperty("UpdateDate").GetValue(obj, null);
	_LogEntry.UpdateBy = (int) obj.GetType().GetProperty("UpdateBy").GetValue(ob, null);

	_LogEntry.SQLAction = SQLAction;

	// Get table name and key values from NPoco attributes
	_LogEntry.TableName = TableInfo.FromPoco(obj.GetType()).TableName;
	_LogEntry.TableKeyNames = TableInfo.FromPoco(obj.GetType()).PrimaryKey;
	_LogEntry.TableKey = obj.GetType().GetProperty(_LogEntry.TableKeyNames)?.GetValue(obj, null).ToString() ?? "";

	_LogEntry.ColumnNames = "";
	_LogEntry.ColumnValues = "";

	// Build log entry strings with object names and values
	foreach (var info in obj.GetType().GetProperties())
	{
		var value = info.GetValue(obj, null) ?? "NULL";
		var ignoreColumn = false;

		// Check that the [NPoco.Ignore] or [NPoco.ResultColumn] attribute is not present
		foreach (var attr in info.CustomAttributes)
		{
			if (attr.AttributeType.Name == "IgnoreAttribute" || attr.AttributeType.Name == "ResultColumnAttribute")
			{
				ignoreColumn = true;
			}
		}

		if (!ignoreColumn)
		{
			_LogEntry.ColumnNames = _LogEntry.ColumnNames + "," + info.Name;
			_LogEntry.ColumnValues = _LogEntry.ColumnValues + "," + value.ToString();
		}
	}

	// Trim leading char
	_LogEntry.ColumnNames = _LogEntry.ColumnNames.Substring(1);
	_LogEntry.ColumnValues = _LogEntry.ColumnValues.Substring(1);

	// Insert entry into the Log table
	db.Insert("Log", "LogId", true, _LogEntry);
}
}
{% endhighlight %}

The logging function logs the table name, column names, and values updated, along with the user ID and date.

_Reflection_ is used to inspect the NPoco properties of the object passed in and get the table name and primary key attributes. It should be noted that this logging function can't handle composite keys, that is, primary keys comprised of more than one database column. Some additional logic would be needed.

As an alternative to logging this way, you should consider setting up a database trigger, depending on your project and requirements. But that's another post for another day.

[npoco]: https://www.nuget.org/packages/NPoco/