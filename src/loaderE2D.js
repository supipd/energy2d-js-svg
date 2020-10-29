
var loaderE2D = {
/*
convertor e2d:

    jxo=new JXONo;
    jxo.opts.s.AttrsPref = '';
    jjj = jxo.do($0.value);         // textarea with E2D XML file content
    JSON.stringify(jjj.state,__," ")

*/
    filename: null
// load listed file from prepared url location
,   LoadProjectUrlE2D: function(urlPath, urlFilename) {
        this.filename = urlFilename;
        window.fetch(urlPath + urlFilename)
            .then(r => r.text())
            .then(xmlTxt => {
                loaderE2D.ConvertProjectFile.call(loaderE2D, xmlTxt);
            })
            .catch(console.error.bind(console));    // https://www.tjvantoll.com/2015/12/29/console-error-bind/
    }
// load not listed file from local disk
,   LoadProjectFileE2D: function (evt) {
        var el = evt.currentTarget
        ,	files = el.files
        ,	filename = files.length ? files[0].name : ''
        ,	form = el.form
        ,	filenameEl = form && form.elements.filename
        ;
        if (filenameEl) {
            filenameEl.value = filename;
        }
        this.filename = filename;
        this.readFileAsText( files, this.ConvertProjectFile, this);
        el.value = '';	// clean file input to reloading
    }
,   readFileAsText: function readFileAsText( files, callback, clbkCtx ) {
        if (!files.length) {
            alert('Project file unassigned !');
            return;
        }
        var file = files[0]
        ,	reader = new FileReader()
        ;
        // If we use onloadend, we need to check the readyState.
        reader.onloadend = function(evt) {
            if (evt.target.readyState == FileReader.DONE) { // DONE == 2
                if (typeof callback == 'function' ) {
                    callback.call(clbkCtx || loaderE2D, evt.target.result);
                }
            }
        }
        reader.readAsText(file);
    }
,   ConvertColorNumbers: function ConvertColorNumbers( hTxt ) {
        if (hTxt.toString()[0] == '#') {
            return { value : hTxt };
        }
        var minus = (hTxt < 0) || (hTxt[0] == '-')
        ,   value = (hTxt.toString().substring(minus ? 1:0)).padStart(6,'0')
        ,   integ = parseInt((minus ? "-0x":"0x")+value)
        ,   plusInt = minus ? (0x1000000+integ) : integ
        ;
        return { value: '#' + plusInt.toString(16).padStart(6,'0') };
    }
,   ConvertProjectFile: function ConvertProjectFile( xmlTxt ) {
        // conversion XML - OBJ with special care of attributes names and colors conversion
        var jxo=new JXONo 
        ,   cnv_signal = false
        ,   colorTags = ['texture_fg','texture_bg','color','velocity_color']
        ,   prjObj
        ;
        jxo.opts.s.AttrsPref = '';
        try {
            prjObj = jxo.textXtoj(xmlTxt, __, __, __, (state, item/*, oPar*/)=>{
                if ((state == JXONo.CLBK_ATTRIBUTE_VALUE) && (colorTags.indexOf(item.nodeName) >= 0)) {
                    item.value = this.ConvertColorNumbers(item.value).value;
                    return {value: item};
                }
                if ((state == JXONo.CLBK_OBJECT_PROPERTY_NAME) && (colorTags.indexOf(item) >= 0)) {
                    cnv_signal = true;
                }
                if (cnv_signal && (state == JXONo.CLBK_OBJECT_TEXT)) {
                    cnv_signal = false;
                    return this.ConvertColorNumbers(item);
                }
            });
        } catch(e) {
            prjObj = null;
            console.error(e);
        }
        if (prjObj && prjObj.state) {
            var model_name = this.filename;
// ----------------------------------- global !!!
            models_library = models_library || {};
            models_library[model_name] = prjObj.state;
            e2dUI.addE2dModel(model_name);
            e2dUI.loadModelState(model_name);
// -----------------------------------
        }
        console.log(prjObj);
        return prjObj;
    }
}
