---
layout: post
title:  "Generating a year prefixed serial number in SQL"
date:   2015-10-15 00:41:13 -0500
categories: sql database
---
An existing SQL function I was using created year-prefixed serial numbers. This year it eventually ran into a problem where it couldn't go higher than _201502015_. Here's my complete rewrite of that function:

{% highlight sql %}
BEGIN
	DECLARE @SerialNumber int

	-- Get current year as string
	DECLARE @Year varchar(4) = YEAR(GETDATE())

	-- Get current max inmate number
	DECLARE @CurrentMax int
	SELECT	@CurrentMax = MAX(SerialNumber)
	FROM	Serials
	WHERE	SerialNumber LIKE @Year +'%'

	-- Remove only the first instance of the year in the max serial number
	DECLARE @NextSeq int
	SET	@NextSeq = Stuff(@CurrentMax, CharIndex(@Year, @CurrentMax), Len(@Year), '')

	-- Increment sequence number
	SET	@NextSeq = ISNULL(@NextSeq, 0) + 1

	-- Convert sequence number to string for concatenation
	DECLARE @NextStr varchar(5) = @NextSeq

	-- Return zero padded serial number as integer with year prefix
	SET	@SerialNumber = @Year + RIGHT('00000' + @NextStr, 5)

	RETURN @SerialNumber
END
{% endhighlight %}

The function above generates an incrementing zero padded serial number with the current year prefixed, as such:

>201500001, 201500002, ..., 201502016

What you want to avoid is using the `Replace()` function to trim out the year from the preceding serial number, because, well, it will `Replace()` all over that value like nobody's business.  Here I'm using

`Stuff(@CurrentMax, CharIndex(@Year, @CurrentMax), Len(@Year), '')`

to only trim out the first instance of the year.