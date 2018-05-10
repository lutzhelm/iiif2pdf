/*
 * (c) Leander Seige, 2018, GPL Version 3, leander@seige.name
 */


function iiif2pdfDoc(config) {

// Global Variables

// var manifest = "https://iiif.ub.uni-leipzig.de/0000009283/manifest.json"
// var uri = "https://iiif.ub.uni-leipzig.de/0000009283/range/LOG_0009"

// Example 1: a Range
var manifest = "https://iiif.ub.uni-leipzig.de/0000002636/manifest.json"
var uri = "https://iiif.ub.uni-leipzig.de/0000002636/range/0-2-15"

// Example 2: a Sequence
// var manifest = "https://iiif.ub.uni-leipzig.de/0000009359/manifest.json"
// var uri = "https://iiif.ub.uni-leipzig.de/0000009359/sequence/1"

// var manifest = "https://digi.vatlib.it/iiif/MSS_Vat.lat.3225/manifest.json"
// var uri = "https://digi.vatlib.it/iiif/MSS_Vat.lat.3225/range/r0-0"


// Function

var gui_progress
var gui_btnsave
var gui_btncreate

$(document).ready(function () {

  var divid = document.getElementById(config["div_id"])

  gui_progress = document.createElement("progress")
  gui_progress.setAttribute("value", "0")
  gui_progress.setAttribute("max", "100")
  divid.appendChild(gui_progress)

  gui_btncreate = document.createElement("button")
  var create_txt = document.createTextNode("Create PDF")
  gui_btncreate.appendChild(create_txt)
  divid.appendChild(gui_btncreate)
  gui_btncreate.onclick=function(){createPDF()}

  gui_btnsave = document.createElement("button")
  gui_btnsave.setAttribute("disabled","true")
  var save_txt = document.createTextNode("Save PDF")
  gui_btnsave.appendChild(save_txt)
  divid.appendChild(gui_btnsave)

})


function recSearch(uri,data) {
  var retval = false
  for(e in data) {
      if(data[e] instanceof Object ) {
        if('@id' in data[e]) {
          if(data[e]['@id'] == uri) {
            return data[e]
          }
        }
        retval = recSearch(uri,data[e])
        if(retval!=false) return retval
      }
    }
    return retval
  }

function createPDF() {
  gui_btncreate.setAttribute("disabled","true")
  $.getJSON(manifest,function(result){
    var m = new iiifManifest(manifest,result)
    m.getURI()
    var subset = m.getSubset(uri)
    if(subset['@type']=="sc:Range") {
      var iiifobj = new iiifRange(subset)
    } else if(subset['@type']=="sc:Sequence") {
      var iiifobj = new iiifSequence(subset)
    }
    var canvases = iiifobj.getCanvases()
    var doc = new pdfDoc(iiifobj,canvases,m)
  })
}

// Class iiifRange

function iiifRange(data) {
  this.data = data
}

iiifRange.prototype.getCanvases = function() {
  var retval = []
  for(e in this.data['canvases']) {
    retval.push(this.data['canvases'][e])
  }
  return retval
}

// Class iiifSequence

function iiifSequence(data) {
  this.data = data
}

iiifSequence.prototype.getCanvases = function() {
  var retval = []
  for(e in this.data['canvases']) {
    retval.push(this.data['canvases'][e]['@id'])
  }
  return retval
}

// Class iiifManifest

function iiifManifest(manifest, data) {
  this.uri = manifest
  this.data = data
}

iiifManifest.prototype.getURI = function() {
  console.log("Hello, I'm " + this.uri)
  console.log(this.data['@id'])
}

iiifManifest.prototype.getSubset = function(uri) {
  var subset = recSearch(uri, this.data)
  // console.log(subset)
  return subset
}

// Class iiifCanvas

function iiifCanvas(data) {
  this.data = data
  this.img = null
}

iiifCanvas.prototype.getImage = function(pdfobj) {
  var surl = this.data['images'][0]['resource']['service']['@id']
  var iurl = surl+"/full/1024,/0/default.jpg"
  this.img = new Image
  this.img.crossOrigin = "Anonymous"
  this.img.onload = function() {
    pdfobj.cd--
    gui_progress.setAttribute("value",((pdfobj.mx-pdfobj.cd)*100)/pdfobj.mx)
    if(pdfobj.cd==0) {
      gui_btnsave.onclick=function(){pdfobj.savePDF()}
      gui_btnsave.removeAttribute("disabled","true")
      pdfobj.addImages()
    }
  }
  this.img.src = iurl
}

// Class docPDF

function pdfDoc(o,canvases,m) {
  this.canvases = canvases
  this.canvobjs = []
  this.cd = canvases.length
  this.mx = canvases.length
  this.document = new jsPDF()
  var cursor = 20

  this.document.setFontSize(16)
  this.document.text(20, cursor, m.data['label'])
  cursor+=8
  this.document.setFontSize(14)
  if('label' in o.data) {
    this.document.text(20, cursor, o.data['label'])
    cursor+=12
  }
  this.document.setFontSize(10)
  this.document.text(20, cursor, m.data['@id'])
  cursor+=8
  this.document.text(20, cursor, m.data['attribution'])
  cursor+=12
  this.document.setFontSize(14)
  this.document.text(20, cursor, "Metadaten")
  this.document.setFontSize(10)
  cursor+=12
  for(md in m.data.metadata) {
    this.document.text(20, cursor, m.data['metadata'][md]['label']+": "+m.data['metadata'][md]['value'])
    cursor+=8
  }

  for(c in canvases) {
    var subset = m.getSubset(canvases[c])
    var canvobj = new iiifCanvas(subset)
    this.canvobjs.push(canvobj)
    canvobj.getImage(this)
  }

}

pdfDoc.prototype.savePDF = function() {
  this.document.save("test.pdf")
}

pdfDoc.prototype.addImages = function() {
  for(c in this.canvobjs) {
    var width = this.document.internal.pageSize.width
    var height = this.document.internal.pageSize.height
    this.document.addPage()
    this.document.addImage(this.canvobjs[c].img, 0, 0, width, height )
  }
}

// Start








}
