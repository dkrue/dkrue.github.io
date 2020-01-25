---
layout: post
title:  "Single click checkbox editing for Kendo grids"
date:   2015-10-14 15:33:03 -0500
categories: kendo javascript jquery
---
This is possibly the most anti-climatic code ever. You click a checkbox in a column, and click the save button. It just works. Except that's not a default behavior supported in Kendo UI. Depending on how you do it, you either have to click into the cell, then the click the checkbox, or maybe your checkbox value won't save at all.

The goal here is to have a grid column displayed as checkboxes for boolean values. The problem is the checkbox displayed isn't connected to the data structure behind the Kendo Grid.

Telerik has an [example of checkbox column editing](http://www.telerik.com/support/code-library/checkbox-column-and-incell-editing), but it's hard coded with a grid id, column name, and checkbox class.  We need something that can be applied to all grids in an application!

Behold...

{% highlight js %}
// On jQuery document ready
jQuery(function ($) {

    // Synchronize the kendo grid data to user clicked checkbox value
    // This is necessary for single-click grid editing on checkboxes for the checkbox state to be saved properly
    // This delegate event handler applies to all kendo grids
    $("body").on("click", "td", function(e) {

        // Get the parent grid from the cell clicked
        var grid = $(this).closest(".k-grid").data().kendoGrid;

        // Get the selected row and column from the cell clicked
        var row = $(this).closest("tr");
        var colId = $("td", row).index(this);

        // Get the column binding name from the grid properties
        var colBinding = grid.options.columns[colId].field;

        // Look for an enabled checkbox input inside the cell clicked
        var chk = $(this).children("input[type=checkbox]:enabled");
        if (chk.length) {

            // Get the Kendo data structure which keeps track of grid edits for the chosen row
            var dataItem = grid.dataItem(row);

            // FINALLY: Set the boolean data value to the checkbox value in the cell clicked
            dataItem.set(colBinding, chk[0].checked);

        }
    });
});
{% endhighlight %}

Now any grid in your application will allow the user to click into the checkbox directly, and save the grid.

If you're still stuck on how to get a checkbox showing in a Kendo grid column in the first place, here's how to do it with ASP.NET MVC wrappers:

{% highlight html %}
columns.Bound(p => p.IsActive).ClientTemplate("<input type='checkbox' #= IsActive ? checked='checked' : '' # />");
{% endhighlight %}