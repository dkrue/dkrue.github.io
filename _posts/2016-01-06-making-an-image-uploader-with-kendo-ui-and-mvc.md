---
layout: post
title:  "Making an image uploader with Kendo UI and MVC"
date:   2016-01-06 19:45:38 -0500
categories: kendo javascript jquery mvc
---
The <a href="http://docs.telerik.com/kendo-ui/aspnet-mvc/helpers/upload/overview">Telerik documentation</a> for the Kendo MVC file uploader only covers the basics for this control. Here is a more complete example on how you might set up an **image uploader**, with **error handling**, and saving the **image data**.

The Razor syntax for my upload control using MVC server wrappers looks like this:

{% highlight c# %}
@(Html.Kendo().Upload()
    .Name("ImageUpload")
    .Messages((m => m.Select("Select image file...")))
    .Multiple(false)
    .Events(events =>
    {
        events.Error("image_file_failure");
        events.Select("image_file_select");
        events.Success("image_display_refresh");
        events.Upload("image_file_upload");
    })
    .Async(a => a
        .Save("ImageSave", "Home")
        .AutoUpload(true)
    )
    .HtmlAttributes(new { accept = "image/*" })
)
{% endhighlight %}

The `HtmlAttribute` above sets the default type of file the user can select from their system. The user can change it to "All Types" though, so we'll need to validate their choice is a file type we can accept.

The JavaScript events below add extra data parameters to the upload (`image_file_upload`), validate the file type (`image_file_select`), and handle errors from the server (`image_file_failure`).
{% highlight js %}
function image_file_upload(e) {
    e.data = { UserId: @Model.UserId };
}

function image_file_select(e) {
    var acceptedFiles = [".jpg", ".jpeg", ".png", ".gif", ".bmp"];
    var isAcceptedImageFormat = ($.inArray(e.files[0].extension, acceptedFiles)) != -1;

    if (!isAcceptedImageFormat) {
        e.preventDefault();
        errorMessage = "Image file must be one of the following types: JPG, JPEG, PNG, GIF, BMP";
        alert(errorMessage);
    }
}

function image_file_failure(e) {
    var _error;
    if (e.XMLHttpRequest.status == 500) {
        _error = "Server Error: " + $(e.XMLHttpRequest.responseText).filter('title').text();
    } else {
        _error = e.XMLHttpRequest.responseText;
    }

    errorMessage = "There was an error uploading the image file. " + _error;
    alert(errorMessage);
}
{% endhighlight %}

In my case I would receive a 500 server error when the file size exceeded several megabytes, and the server would return an entire error page in `XMLHttpRequest.responseText`. I'm reporting the title of that error page to the user with jQuery.

The MVC controller that accepts the uploaded file needs a `HttpPostedFileBase` parameter with the same name as your Kendo Upload control, in this case `ImageUpload`.

{% highlight c# %}
public ActionResult ImageSave(HttpPostedFileBase ImageUpload, int UserId)
{
    var _Model = new ImageModel();
    return Content(_Model.Save(ImageUpload, UserId));
}
{% endhighlight %}

The Kendo Upload control is expecting an empty string to be returned to it upon success. Any other text means an error has occurred.

Now the image data can be converted into the image format of your choice with the `System.Drawing.Imaging` library, and copied into a byte stream for inserting into your database. Here is the Save method that does that in my model.

{% highlight c# %}
public string Save(HttpPostedFileBase ImageUpload, int UserId)
{
    var _Result = ""; // Kendo uploader expects empty string on success

    if (ImageUpload != null)
    {
        try
        {
            // Read image file
            Image _Image = Image.FromStream(ImageUpload.InputStream);

            // Encode image data as Gif image byte array
            MemoryStream _ImageMemoryStream = new MemoryStream();
            _Image.Save(_ImageMemoryStream, ImageFormat.Gif);
            byte[] _ImageBytes = _ImageMemoryStream.ToArray();

            // Insert byte array data in database
            var _Success = SavePhoto(UserId, _ImageBytes);

            if (!_Success)
            {
                _Result = "Error saving image to database";
            }
        }
        catch (Exception ex)
        {
            _Result = "Error reading image data: " + ex.Message;
        }
    }
    else
    {
        _Result = "Upload Error: Empty file data";
    }

    return _Result;
}
{% endhighlight %}