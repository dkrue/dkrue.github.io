---
layout: post
title:  "Get id when a custom command is clicked in Kendo grids"
date:   2015-12-29 20:01:04 -0500
categories: kendo javascript jquery
---
Quick code tip for getting the row data from a custom command button in Kendo UI grids. This is useful for intercepting a delete event or any custom actions you have set up on a Kendo grid.

{% highlight js %}
function grid_deleterow(e) {
    var row = $(e.currentTarget).closest("tr");
    var data = $("#grid").data("kendoGrid").dataItem(row);
    var id = data.EntityId;
}
{% endhighlight %}

In the JavaScript function above, `id` will contain the value of the `EntityId` column for the row of the custom button clicked. This is great because you don't have to make your grid selectable for this to work.

Here is how the event would be triggered when using the Kendo MVC wrappers:
{% highlight html %}
@(Html.Kendo().Grid<EntityModel>()
    .Name("test_grid")
    .Columns(columns =>
    {
        columns.Bound(p => p.Field1);
        columns.Command(command => command.Custom("Delete").Click("grid_deleterow"));
    })
)
{% endhighlight %}