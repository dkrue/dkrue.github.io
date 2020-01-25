---
layout: post
title:  "Validating Bootstrap radio buttons with Kendo UI"
date:   2015-10-16 04:43:06 -0500
categories: kendo bootstrap javascript jquery
---
Validating radio buttons isn't supported by the Kendo form validator. Add Bootstrap radio buttons in the mix and you've got double the reason to roll your own validation!  Fortunately we can use a little jQuery to require the user to select a radio button, and set the chosen value for form submission. Here's the JavaScript I came up with, triggered on form submit:

{% highlight js %}
$(function () {

    // On form submit, validate and send form by ajax
    $(document).on("click", ":submit", function (event) {

        // Custom validation for required bootstrap radio buttons
        if ($('#radiobuttons').children().filter("[class~='active']").length < 1) {
            $("#validator_msg").show();

        } else {
            $("#validator_msg").hide();
            
             // Set hidden field equal to the chosen radio button's text
            $("#radiovalue").val(
                $('#radiobuttons').children().filter("[class~='active']").text().trim()
             );
             // Submit form by ajax elsewhere
             submit_ajax();
        }

        // Prevent default navigation
        return false;
    });
});
{% endhighlight %}

The related HTML uses Bootstrap radio buttons, and emulates the Kendo validator tooltip to alert the user that the field is required:
{% highlight html %}
<!--Hidden radio button field set on submit -->
<input type="hidden id="radiovalue">
<div class="btn-group" data-toggle="buttons" id="radiobuttons" onclick="$('#validator_msg').hide();&tquo;>
    <label class="btn btn-primary">
        <input type="radio"> Pineapple
    </label>
    <label class="btn btn-primary">
        <input type="radio"> Coconut
    </label>
    <label class="btn btn-primary">
        <input type="radio"> Lime
    </label>
</div>
<!-- Custom kendo tooltip for required radio buttons -->
<span class="k-widget k-tooltip k-tooltip-validation k-invalid-msg field-validation-error" id="validator_msg" role="alert" style="display: none">
    <span class="k-icon k-warning"> </span> Please select a value
</span>
{% endhighlight %}

Now when you attempt to submit the form without selecting a radio button, you should see the Kendo validation tooltip prompting you for required input!