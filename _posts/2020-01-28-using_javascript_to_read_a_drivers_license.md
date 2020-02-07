---
layout: post
title:  "Using JavaScript to read a drivers license"
date:   2020-01-28 16:59:39 -0500
categories: javascript jquery
---

Reading the magnetic stripe on a US driver's license card is easy.  While every state has different data contained on the license, they often follow the [AAMVA card design standards](https://www.aamva.org/DL-ID-Card-Design-Standard/) from the _American Association of Motor Vehicle Administrators_. Check out _Annex F_ in their PDF specification for _optional magnetic stripe_.

### Required hardware
You'll need a cheap USB magnetic card swipe reader used for credit cards or identification cards. They can be found online for less than $20. The card reader acts a USB keyboard, rapidly inputting the data as keystrokes. Try swiping a card into a text editor- you'll get the all of the raw data scrunched into the magstripe!

### Example for Michigan
For this example, we are attempting to read the state code (ISO), date of birth (DOB), and license number (ID). These are all located on track 2 of the magstripe. The ISO IIN code for Michigan code is _636032_. Find the code for your state on the [AAMVA ISO IIN page](https://www.aamva.org/IIN-and-RID/).

{% highlight js %}
// Magstripe reader / card swiper ID data follows AAMVA license spec
var magstripeReader = { Data: "", Start: null, IdStartSentinel: ";", IdEndSentinel: "?", IdFieldSeparator: "=" };

function magstripeIdReaderListen() {
    // Record keystrokes from card reader
    $(document).on("keydown", function magstripeRead (event) {
        event.preventDefault();

        // Begin card swipe
        if (event.key == magstripeReader.IdStartSentinel) {
            magstripeReader.Data = "";
            magstripeReader.Start = new Date();
        }
        // Swipe started, read card data
        else if (magstripeReader.Start) {
            if (event.key == magstripeReader.IdEndSentinel) {
                magstripeReader.Start = null;

                var cardData = magstripeIdReaderParseData();
                console.log(cardData);

                $(document).off("keydown");
                return;
            }
            magstripeReader.Data += event.key;
        }
    });
}

function magstripeIdReaderParseData() {
    // State ISO IIN as defined by AAMVA at start of track 2
    var stateCode = magstripeReader.Data.substr(0, 6);

    var fields = magstripeReader.Data.split(magstripeReader.IdFieldSeparator);
    var id = fields[0].substr(6); // ID# starts after 6 char state ISO IIN
    var dob = fields[1].substr(4) // DOB starts after 4 char expiration (CCYYMMDD format)

    if (fields[2].length > 0) {

        // Michigan uses this overflow field as an encoded letter prefix
        if (stateCode == "636032") {

            var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
            var idprefix = alphabet[fields[2] - 1];

            id = idprefix + id;
        }
        else {
            id += fields[2]; // ID overflow by default
        }

    }

    return { Id: id, StateIIN: stateCode, DOB: dob };
}
{% endhighlight %}

### Parsing the data

Some states such as Michigan, where I’m located, only use track 2 and do not encode any name or address information on the magstripe. When you swipe the card, the raw data looks something like this fake data:

`;636032626035300300=210519650501=11=?`

Whoa! Let's break down the raw data piece by piece.

| ; | 636032 | 626035300300 | = | 2105 | 19650501 | = | 11 | = | ? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| start sentinel | state ISO IIN | license number | separator | expiration | birthdate | separator | overflow | separator | end sentinel |
| | _6 char_ | _variable length, up to 13 char_ | | _4 char: YYMM_ | _8 char: CCYYMMDD_ | | _variable length, coded prefix letter_ | |


When parsing the data for Michigan, the variable length overflow field is used to hold an alpha character prefixed to the license number _(A=1, Z=26)_. You'll want to consult the [AAMVA card design standards](https://www.aamva.org/DL-ID-Card-Design-Standard/) to see how the data can be laid out on the mapstripe for your state!