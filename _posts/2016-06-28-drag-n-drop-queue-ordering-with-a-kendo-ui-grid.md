---
layout: post
title:  "Drag n drop queue ordering with a Kendo UI grid"
date:   2016-06-28 05:01:10 -0500
categories: kendo javascript jquery
---
There are a bunch of examples for drag and drop Kendo grids floating around the web, but this is the only reordering solution that has worked for me with an in-cell editable grid.  It features an automatically updating priority queue column with the row index number.

First let's look at the main reordering functionality, and then complete the user experience with some extra bits for updating the queue.

{% highlight js %}
// Enable drag n drop reordering on this grid - can be done on document.ready
$("#my_grid").data("kendoGrid").table.kendoSortable({
    filter: ">tbody >tr",
    hint: $.noop,
    cursor: "move",
    ignore: "TD, input",
    placeholder: function (element) {
        return element.clone().addClass("k-state-hover").css("opacity", 0.65);
    },
    container: "#my_grid tbody",
    change: grid_reorder
});


// Reordering event triggered by user releasing drag n drop element
function grid_reorder(e) {

    // Get data from drag n drop html element
    var grid = $("#my_grid").data("kendoGrid");
    var dataItem = grid.dataSource.getByUid(e.item.data("uid"));

    // Copy data into new grid row location
    grid.dataSource.remove(dataItem);
    grid.dataSource.insert(e.newIndex, dataItem);

    // Get rid of delete request caused by dataSource.remove
    for (var i = 0; i < grid.dataSource._destroyed.length; i++) {
        if (grid.dataSource._destroyed[i].uid == dataItem.uid) {
            grid.dataSource._destroyed.splice(i, 1);
        }
    }

    // Update ordering of all grid rows
    for (var i = 0; i < grid.dataSource.data().length; i++) {
        grid.dataSource.data()[i].set("PriorityOrder", i + 1);
    }
}
{% endhighlight %}

Setting up drag n drop on the grid is accomplished above using `kendoSortable`. Beyond that, Kendo leaves reordering the associated grid data up to the user from what I could gather. My solution removes and inserts the row in its new location, and then removes the subsequent delete request from the grid's private `_destroyed` array to avoid false deletes. I then update the `PriorityOrder` column for all rows, as this is the queue that is shown to the user.

Next we need to take care of updating the priority queue when the user inserts a new row. The grid's `Edit` event is triggered by Kendo when the add button is clicked, giving focus to the first cell and opening it for editing.

{% highlight js %}
function grid_editcell(e) {
    // Do not allow user to set priority, but keep it editable so it can be updated by drag n drop
    if (e.container.find("input[name=PriorityOrder]").length > 0) {
        e.sender.closeCell(e.container);

        // If user is adding a new row update entire queue order
        if (e.model.isNew()) {
            for (var i = 1; i < e.sender.dataSource.data().length; i++) {
                e.sender.dataSource.data()[i].set("PriorityOrder", i + 1);
            }
        }
    }
}
{% endhighlight %}

Don't forget about the user removing a row...

{% highlight js %}
function grid_removerow(e) {
    // Remove row then update entire queue order
    this.removeRow($(e.target).closest("tr"));
    var grid = $("#my_grid").data("kendoGrid");

    for (var i = 0; i < grid.dataSource.data().length; i++) {
        grid.dataSource.data()[i].set("PriorityOrder", i + 1);
    }
}
{% endhighlight %}

Now let's take a look at a (simplified) grid definition in Razor code, as I'm using ASP MVC wrappers to generate the grid. If you're not using wrappers you should be able to make out the important bits.

{% highlight html %}
@(Html.Kendo().Grid<MyProj.ExampleClass>()
    .Name("my_grid")
    .Columns(columns =>
    {
        columns.Bound(p => p.PriorityOrder).Width("75px")
                .ClientTemplate("<span class='fa fa-arrows drag-handle'></span> &amp;nbsp; #=PriorityOrder#");
        columns.Bound(p => p.Amount).Format("{0:C2}");
        columns.Bound(p => p.UpdateDate).Format("{0:MM/dd/yyyy}");
        columns.Command(command => command.Custom("Delete").Click("grid_removerow"))
                .Title("Action").Width("60px");
    })
    .Editable(editable => editable.Enabled(true).Mode(GridEditMode.InCell))
    .Events(events => events
        .Edit("grid_editcell")
    )
    .DataSource(dataSource => dataSource.Ajax().Batch(true)
        .Model(model =>
        {
            model.Id(key => key.ExampleKey);
            model.Field(f => f.PriorityOrder).DefaultValue(1);
            model.Field(f => f.UpdateDate).Editable(false);
        })
        .Create(create => create.Action("Grid_Create", "Home"))
        .Read(read => read.Action("Grid_Read", "Home"))
        .Update(update => update.Action("Grid_Update", "Home"))
        .Destroy(destroy => destroy.Action("Grid_Delete", "Home"))
    )
)
{% endhighlight %}
I have Font Awesome displaying the classic Windows "move" arrow icon as a drag handle in the `PriorityOrder` queue column as a client template.

When a grid row is inserted, the `grid_editcell` event is triggered, which causes the queue to refresh. I found that it was necessary to keep the `PriorityOrder` column editable, so the values could be visually refreshed. To prevent the user from manually changing the queue, any cell in the `PriorityOrder` column is closed immediately upon click.

Lastly each row has a custom delete button, which triggers the queue refresh when the row is removed.