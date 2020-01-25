---
layout: post
title:  "Getting foreign keys both ways in SQL Server"
date:   2016-02-22 22:02:50 -0500
categories: sql database
---
I'm posting this one here for myself. Whenever I get lost finding foreign keys in a SQL Server database I use this for a neat and tidy list of all foreign key constraints on a table.

This bit of SQL will go both ways for any given table. First it'll get you a list of columns referencing other tables, then secondly a list of other tables referencing your table.  Just supply it with a table name and you're good to go.

{% highlight sql %}
DECLARE @TABLE_NAME VARCHAR(30) = 'Customer'

-- Foreign keys referencing other tables
SELECT	object_name(f.parent_object_id) ParentTable,
		col_name(fc.parent_object_id,fc.parent_column_id) ColumnName,
		object_name(f.referenced_object_id) RefTable,
		f.name ConstraintName
FROM	sys.foreign_keys f
JOIN	sys.foreign_key_columns AS fc ON f.object_id = fc.constraint_object_id
WHERE	f.parent_object_id = object_id(@TABLE_NAME)


-- Foreign keys refrencing this as a parent table
SELECT	object_name(f.parent_object_id) ParentTable,
		col_name(fc.parent_object_id,fc.parent_column_id) ColumnName,
		object_name (f.referenced_object_id) RefTable,
		f.name ConstraintName
FROM	sys.foreign_keys AS f
JOIN	sys.foreign_key_columns AS fc ON f.object_id = fc.constraint_object_id
JOIN	sys.tables t ON t.object_id = fc.referenced_object_id
WHERE	object_name (f.referenced_object_id) = @TABLE_NAME
{% endhighlight %}

I put this together based off of this <a href="http://stackoverflow.com/questions/17501840/how-can-i-find-out-what-foreign-key-constraint-references-a-table-in-sql-server" target="_blank">StackOverflow</a> answer.

Also check out the command `sp_help 'TableName'` for a bunch of useful information on a table, including foreign keys.