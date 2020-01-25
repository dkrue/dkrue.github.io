---
layout: post
title:  "Multi-page PDF printing for Kendo UI grids"
date:   2016-02-04 20:18:24 -0500
categories: kendo javascript pdf
---
The examples on <a href="http://docs.telerik.com/kendo-ui/framework/drawing/pdf-output" targe="_blank">Telerik's site</a> are a little sparse for PDF printing. Sure, it's easy to print a <a href="http://demos.telerik.com/kendo-ui/grid/pdf-export" target="_blank">Kendo grid to PDF</a>, but let's say you want to include other sections of the web page, or add a header, without creating an entirely separate "printable view".

It took a lot of experimenting to arrive at the simple solution below. What all does it do?

- Prints any section of the HTML document, including grids
- Automatically determines page breaks for large grids
- Scales the PDF contents to look good on a standard piece of paper
- Displays a header and footer on each page with page numbers


All that power is packed into this JavaScript function:

{% highlight js %}
function page_grid_render_pdf() {
    kendo.drawing.drawDOM($("#printable_area"),
        {
            paperSize: [1100, 1430], // Scaling in pt - 8.5"x11" page ratio
            landscape: true,
            margin: { left: "0mm", top: "15mm", right: "0mm", bottom: "10mm" },
            template: $("#pdf-page-template").html()
        }).then(function (documentgroup) {

            // Generate PDF file
            kendo.drawing.pdf.saveAs(documentgroup, "KendoPDF.pdf");
        });
}
{% endhighlight %}

You'll also need to use the following section as the header and footer template.
{% highlight html %}
<script type="x/kendo-template" id="pdf-page-template">
    <div class="pdf-page-template">
        <div class="pdf-page-header">
            <span style="font-size: 140%;">
                PDF Printing with Kendo UI
            </span>
            <div style="float: right">Page #:pageNum# of #:totalPages#</div>
        </div>
        <div class="pdf-page-footer">
            <div style="float: right">Page #:pageNum# of #:totalPages#</div>
        </div>
    </div>
</script>
{% endhighlight %}

When you call the JavaScript printing function, it will render everything in `<div id="printable_area">` My printable area contains user information and a grid with user data.

The <strong>paper size</strong> is set very large to take advantage of your browser or PDF viewer's built-in <em>fit to page</em> functionality when printing. When I set paper size to the standard "Letter" size, my Kendo grid was enormous, and only a few rows fit on each page.  Using a large paper size prints it out as it appears on your screen.

I set the side <strong>margins</strong> to zero, while leaving space for the header and footer, since again your browser or PDF viewer will add its own margins.

You may notice I am not using any of the <strong>page-break</strong> options mentioned in the Kendo PDF documentation. I tried them all and this automatic version seems to work the best with large grids, and it doesn't require any manual page breaks added to grid rows.

Another tip is to include the Pako compression library that comes with Kendo UI: `pako_deflate.min.js` Kendo will automatically use it when included, and it reduced my PDF file size ten times over!