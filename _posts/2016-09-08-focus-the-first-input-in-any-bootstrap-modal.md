---
layout: post
title:  "Focus the first input in any Bootstrap modal"
date:   2016-09-08 15:12:36 -0500
categories: bootstrap javascript jquery
---
If you're accepting user input in a bootstrap modal, or you just want to be more friendly to your keyboard-based users, here's how to focus the first input element on any bootstrap modal in a global context.

{% highlight js %}
$(document).on('shown.bs.modal', function (e) {
     $(e.target).find(":input").not(".close").filter(":visible:first").focus();
});
{% endhighlight %}
A few things are happening here:

<ul>
    <li>A delegate event listener is placed on the document (preferably in your jQuery document ready function)</li>
    <li>The event <em>shown.bs.modal</em> is triggered when a bootstrap modal is opened</li>
    <li>We find the modal element triggering this function with <em>e.target</em></li>
    <li>We exclude the <strong>(X)</strong> close button from being selected</li>
    <li>We focus the first visible input element (text, button, etc.)&nbsp;</li>
</ul>

The nice thing about doing it this way is it applies to all popup modals across the board. It's an easy one-size-fits-all solution for large applications!