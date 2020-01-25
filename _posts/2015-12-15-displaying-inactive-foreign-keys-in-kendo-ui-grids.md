---
layout: post
title:  "Displaying inactive foreign keys in Kendo UI grids with cell editing"
date:   2015-12-15 17:37:48 -0500
categories: kendo javascript jquery
---
Foreign key columns in Kendo UI are pretty great. With in-grid editing, you can use them to display a choice of categories, people, and so on.  At some point you may need to mark a category as inactive or disabled, so that the user can no longer select that foreign key as a valid choice. So how do you display old deactivated foreign keys in your Kendo grid for record keeping purposes?

By selecting the foreign key text value into our grid as a hidden column, we can use that to resolve any deactivated foreign keys.  Here is the JavaScript function that will display the text equivalent of the foreign key, and use the hidden column as a backup source for inactive foreign keys.

{% highlight js %}
var collection;
function getforeignkeytext(rowData) {

    if (!collection) {
        var grid = $("#grid").data("kendoGrid");
        var foreignKeys = grid.options.columns[2].values; // Set the FK column index
        collection = {};
        for (var i in foreignKeys) {
            collection[foreignKeys[i].value] = foreignKeys[i].text;
        }
    }

    var result = collection[rowData.CategoryId];
    if (result == undefined) {
        result = rowData.CategoryName;
    }
    return result;
}
{% endhighlight %}

For our grid to use this, use a client template for the foreign key column set to use the function above. I am using the MVC server wrappers in this example.
{% highlight html %}
columns.ForeignKey(p => p.CategoryId, Model.CategoryDropdown, "Value", "Text")
       .ClientTemplate("#=getforeignkeytext(data)#");
{% endhighlight %}

Why go through all that trouble when something simple like `.ClientTemplate("#=CategoryName#")` would display the hidden column value? That solution won't correctly display an edited value, before the user saves the grid when using `GridEditMode.InCell`.

So what about when editing the cell? It would be super nice if the dropdown also magically contained the inactive foreign key as a choice _only for that cell_. That would really complete the user experience.  With a second JavaScript function we can take care of that.

{% highlight js %}
function editforeignkey(e) {
    var valueToAddToDropdown = e.model.CategoryId;
    var textToAddToDropdown = e.model.CategoryName;

    var dropdown = e.container.find('[data-role=combobox]').data();

    if (typeof dropdown != "undefined") {
        var valueExists = false;
        for (var i = 0; i < dropdown.kendoComboBox.dataSource._data.length; i++) {
            if (dropdown.kendoComboBox.dataSource._data[i].Value == valueToAddToDropdown) {
                valueExists = true;
            }
        }
        if (!valueExists) {
            dropdown.kendoComboBox.dataSource.add({ Text: textToAddToDropdown, Value: valueToAddToDropdown });
        }
    }
}
{% endhighlight %}

The function above is triggered on the Kendo grid's `edit` event. It attempts to find the foreign key value in the cell's dropdown, and adds it if necessary. The value will be automatically selected.

There does appear to be one limitation. If the user changes an inactive foreign key value to an active one, _and the cell loses focus_, then the inactive foreign key can no longer be reselected, unless all grid changes are cancelled.

With this technique you can provide users with a cohesive experience for Kendo grids containing historical foreign key data.