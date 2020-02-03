---
layout: post
title:  "Taking cropped webcam photos with live digital zoom preview"
date:   2020-02-01 00:28:29 -0500
categories: javascript chrome
---

Taking a photo from a cropped webcam video can be useful for taking square identification photos, or any other situation where you'd like to crop out most of the background without needing the subject to get super close to the web camera.

My **example for Chrome:** _[Digital Webcamera Zoom](/examples/digital_webcam_zoom.html)_ shows how to provide the user with an approximate live preview of what will be cropped from the image using an HTML5 canvas overlay. It also demonstrates initializing the camera with Full-HD resolution (1920x1080), progressively falling back to lower resolutions if needed.

One thing to note is that behind the scenes, a full-resolution photo is being taken, even though the video and photo previews are smaller.  The video and canvas elements remain in full resolution, while CSS styling resizes the HTML element to appear smaller. You can then scale and crop the final image using a high-quality server side library such as [Microsoft .NET Core Image Processing](https://devblogs.microsoft.com/dotnet/net-core-image-processing/)

This uses the _ImageCapture Web API_ as demonstrated in [Google Chrome's Github](https://googlechrome.github.io/samples/image-capture/grab-frame-take-photo.html) to grab a high-quality still frame from the live video. Not all browsers support this feature but support is growing.

## Code highlights
### Drawing the scaled and cropped photo
The photo is captured from the video feed using Chrome's `ImageCapture` API. Then you can then draw the image onto a canvas to scale and crop it. Some trial and error was needed to get an algorithm that looked good at every resolution. Note that Full-HD and HD webcams have a wider aspect ratio than VGA webcams.

{% highlight js %}
function photo_click(canvasId) {
    imageCapture.takePhoto()
        .then(blob => createImageBitmap(blob))
        .then(imageBitmap => {

            const canvas = document.querySelector("#" + canvasId);
            photo_drawcanvas(canvas, imageBitmap);
        })
        .catch(error => console.error(error));
}

function photo_drawcanvas(canvas, img) {
    // set canvas size equal to camera size to keep full quality of image behind the scenes
    // css will style the canvas element to appear smaller in the browser
    canvas.width = img.width;
    canvas.height = img.height;
    var aspectRatio = canvas.width / canvas.height;

    // variable width photo preview to match camera aspect ratio
    var previewHeight = parseInt($(canvas).css("height"), 10);
    $(canvas).css("width", Math.floor(previewHeight * aspectRatio));

    // draw zoomed image: starting at position, clip size, draw at, draw at clip size
    var zoom = $("#camera_zoom").data("kendoSlider").value() - 1;
    canvas.getContext('2d').drawImage(img, zoom * 60 * aspectRatio, zoom * 60, img.width, img.height, 0, 0, img.width + (zoom * 100 * aspectRatio * 2), img.height + (zoom * 100 * 2));

    // clear sides to preview how the image will look when cropped square
    canvas.getContext('2d').clearRect(0, 0, (canvas.width - canvas.height) / 4, canvas.height);
    canvas.getContext('2d').clearRect(canvas.width - (canvas.width - canvas.height) / 4, 0, canvas.width, canvas.height);
}
{% endhighlight %}

### Drawing the translucent crop preview
Changing the zoom slider draws an HTML5 canvas overlay on top of the video preview. The canvas is positioned using `position:absolute` over the HTML5 video element in CSS.
{% highlight js %}
function photo_zoom_change(e) {
    var canvas = document.getElementById("photo_overlay");
    canvas.width = document.querySelector('video').videoWidth;
    canvas.height = document.querySelector('video').videoHeight;
    var aspectRatio = canvas.width / canvas.height;

    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var zoom = $("#camera_zoom").data("kendoSlider").value() - 1;
    ctx.clearRect(zoom * 60 * aspectRatio, zoom * 20, canvas.width - (zoom * 120 * aspectRatio), canvas.height - (zoom * 60));
}
{% endhighlight %}