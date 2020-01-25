---
layout: post
title:  "Sorting Kendo foreign key columns by text in MVC"
date:   2015-10-21 19:41:48 -0500
categories: kendo
---
The Kendo UI MVC wrappers make it very easy to have a dropdown in a grid column as a foreign key. You may notice that the column sorts by the id though, and not the text value that would make sense to the user.

The Kendo documentation has a great example of [custom binding](http://docs.telerik.com/kendo-ui/aspnet-mvc/helpers/grid/custom-binding) in MVC for custom sorting, filtering, and paging.

I wanted something lightweight to use that didn't require rewriting all of a grid's sorting functionality. Here is how I translate the sort type in a grid's `Read` method in the controller.

{% highlight c# %}
public JsonResult Coco_Read([DataSourceRequest]DataSourceRequest request)
{   
	// Sort foreign key columns by text not id
	foreach (SortDescriptor sortDescriptor in request.Sorts)
	{
		switch (sortDescriptor.Member)
		{
			case "CocoTypeId":
			request.Sorts[request.Sorts.IndexOf(sortDescriptor)].Member = "CocoTypeName";
			break;
		}
	}

	return Json(Model.GetCoco().ToDataSourceResult(request), JsonRequestBehavior.AllowGet);
}
{% endhighlight %}

My solution replaces any sort for the foreign key column `CocoTypeId` with the hidden text equivalent column `CocoTypeName`.  This is the easiest technique I could come up with for sorting from what [Telerik recommends](http://www.telerik.com/forums/custom-sort-example-for-mvc-wrappers#8w2GoKbfhUel9QMUISc5Iw).