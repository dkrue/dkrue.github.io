---
layout: post
title:  "Greatest-N-Per-Group: Getting the latest result for each user"
date:   2015-10-15 00:15:36 -0500
categories: sql database
---
This algorithm comes up a lot in the system I'm building. Get the most recent _whatever_ for each user, along with all their information. Also known as the **greatest-n-per-group** problem. Here's the most efficient SQL algorithm I've come across:

{% highlight sql %}
SELECT   C.ClientId, C.LastName, L.LocationName AS CurrentLocation
FROM     Client C
LEFT JOIN (SELECT t1.*
	FROM (SELECT * FROM Location WHERE UpdateDate < @Date) AS t1
	LEFT JOIN (SELECT * FROM Location WHERE UpdateDate < @Date) AS t2
	ON t1.ClientId = t2.ClientId AND t1.UpdateDate < t2.UpdateDate
	WHERE	t2.ClientId IS NULL) AS L ON C.ClientId = L.ClientId
{% endhighlight %}

This query finds the latest location for each client as of the supplied `@Date`. The main part of the algorithm reads as:

> Return the row t1 for which no other row t2 exists with the same ClientId and a greater UpdateDate

The outer left join allows us to return users with no entries in the location table.