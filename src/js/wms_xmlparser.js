/* Fetching the xml from the given URL,
It will call when value of URL select box change */
$('#urls').on('change', function(){
    var request_url = this.value+"?service=wms&request=getCapabilities";
    $.ajax(
        {
            url:request_url,
            type:"GET",
            dataType: 'text',
            success:function(data, status,jqXHR ){
                xml_string = data;
                wms_xmlParser()
                wms_populateForm()
            },
            error: function(data) {
                alert('Error occured!')
            }

        }
    ) 
});

/* XML parser */
function wms_xmlParser() {
    var domparser = new DOMParser();
    var xmldoc = domparser.parseFromString(xml_string,"text/xml");
    available_requests = [];
    spatial_info = [];
    layers = [];
    var request_nodes = xmldoc.getElementsByTagName('Request')[0].childNodes;
    for(j=0;j<request_nodes.length; j++){
        if(request_nodes[j].nodeType == 1 ) {
            available_requests.push(request_nodes[j].nodeName);
        }
    }

    var layer_nodes = xmldoc.getElementsByTagName('Layer')[0].childNodes
    for(i=0; i<layer_nodes.length; i++)
    {
        if (layer_nodes[i].nodeName == 'BoundingBox'){
            spatial_info.push({
                'CRS':layer_nodes[i].getAttribute('CRS'),
                'minx':layer_nodes[i].getAttribute('minx'),
                'miny':layer_nodes[i].getAttribute('miny'),
                'maxx':layer_nodes[i].getAttribute('maxx'),
                'maxy':layer_nodes[i].getAttribute('maxy'),
            });
        } else if(layer_nodes[i].nodeName == 'Layer'){
            layers.push({
                'name':layer_nodes[i].getElementsByTagName('Name')[0].childNodes[0].data,
                'title':layer_nodes[i].getElementsByTagName('Title')[0].childNodes[0].data
            });
        }
    }
}

/* Initialize the values */
function wms_init(){
    xml_string = '';    
    available_requests = []
    spatial_info = [];
    layers = [];
    map = new ol.Map({
        target: 'wms_map',
        layers: [
          new ol.layer.Tile({
            source: new ol.source.OSM()
          })
        ],
        view: new ol.View({
          center: ol.proj.fromLonLat([19.07283, 72.88261]),
          zoom: 0
        })
      });
}

/* Function used to popup the form with XML values */
function wms_populateForm() {
    var new_options = '';
    var new_srs = '';
    var new_layers = '';

    $.each(available_requests, function(i){
        if(available_requests[i]!='GetMap') {
            new_options += '<option disabled value="' + available_requests[i] + '">' + available_requests[i] + '</option>'
        } else {
            new_options += '<option value="' + available_requests[i] + '">' + available_requests[i] + '</option>'
        }
        
    });
    $('#requests option:gt(0)').remove();
    $('#requests').append(new_options);

    $.each(layers, function(i){
        new_layers += '<option value="' + layers[i]['name'] + '">' + layers[i]['title'] + '</option>'
    })
    $('#layers option:gt(0)').remove();
    $('#layers').append(new_layers);

    
    $.each(spatial_info, function(i){
        new_srs += '<option value="' + spatial_info[i]['CRS'] + '">' + spatial_info[i]["CRS"] + '</option>' 
    })
    $('#srs option:gt(0)').remove();
    $('#srs').append(new_srs);
}


$(document).ready(function(){
    wms_init();
});

$('#srs').on('change', function(){
    current_value = this.value;
    var i = spatial_info.length;
    while(i-- >0){
        if(spatial_info[i]['CRS'] == current_value){
            $('#minx').val(spatial_info[i]['minx']);
            $('#miny').val(spatial_info[i]['miny']);
            $('#maxx').val(spatial_info[i]['maxx']);
            $('#maxy').val(spatial_info[i]['maxy']);
        }
    }
});

/* Submit action */
$('#wmsform').on('submit', function(e){
    e.preventDefault();
    url = $('#urls').val();
    request = $('#requests').val();
    srs = $('#srs').val();
    layer = $('#layers').val();
    minx = $('#minx').val();
    miny = $('#miny').val();
    maxx = $('#maxx').val();
    maxy = $('#maxy').val();    

    $('#wms_map').children().remove();

    var map_layers = [
        new ol.layer.Tile({
            source: new ol.source.OSM(),
           }
        ),
        new ol.layer.Tile({
            source: new ol.source.TileWMS({
                url: url,
                params: {
                    'LAYERS': layer,
                    'FORMAT': 'image/png',
                    'TILED': true,
                    'ratio':1
                },
            }),
        })
    ];
    
    var extent = [minx, miny, maxx, maxy];
    var map_prop = ol.proj.get(srs);
    // var extent_new = ol.proj.transform(extent, 'EPSG:4326', srs)
    try{
        map_prop.setExtent(extent);
    } catch(err) {
        alert("There is some issue related to SRS, Try with other SRS");
    }
    var mousecontrol = new ol.control.MousePosition({
        coordinateFormat: ol.coordinate.createStringXY(4),
        projection: map_prop
    })
    
    map = new ol.Map({
        projection: map_prop,
        layers: map_layers,
        controls: ol.control.defaults().extend([mousecontrol]),
        target: 'wms_map',
        view: new ol.View({
          center: ol.proj.transform([0,0], 'EPSG:4326', srs),
          zoom: 7,
        }),
    });

});
