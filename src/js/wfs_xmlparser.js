/* Fetching the xml from the given URL,
It will call when value of URL select box change */
$('#wfs_urls').on('change', function(){
    
    var request_url = this.value;
    $.ajax(
        {
            url:request_url,
            type:"GET",
            dataType: 'text',
            success:function(data, status,jqXHR ){
               xml_string = data;
               wfs_xmlParser()
               wfs_populateForm()
            },
            error: function(data) {
                alert('Error occured!')
            }

        }
    ) 
});

/* XML parser */
function wfs_xmlParser() {
    var domparser = new DOMParser();
    var xmldoc = domparser.parseFromString(xml_string,"text/xml");

    var request_nodes = xmldoc.getElementsByTagNameNS('*','Operation');
    for(j=0;j<request_nodes.length; j++){
        if(request_nodes[j].nodeType == 1 ) {
            available_requests.push(request_nodes[j].getAttribute('name'));
        }
    }

    var feature_types = xmldoc.getElementsByTagName('FeatureType');
    features = [];

    for(i=0; i<feature_types.length; i++)
    {
        features.push({
            'name': feature_types[i].childNodes[0].textContent,
            'title': feature_types[i].childNodes[1].textContent,
            'abstract': feature_types[i].childNodes[2].textContent,
        });
    }

}

/* Initialize the values */
function wfs_init(){
    xml_string = '';    
    available_requests = []
    spatial_info = [];
    features = [];
}

/* Function used to popup the form with XML values */
function wfs_populateForm() {
    var new_options;
    var new_srs;
    var new_features;

    $.each(available_requests, function(i){
        new_options += '<option value="' + available_requests[i] + '">' + available_requests[i] + '</option>'
    });
    $('#wfs_requests option:gt(0)').remove();
    $('#wfs_requests').append(new_options);

    $.each(features, function(i){
        new_features += '<option value="' + features[i]['name'] + '">' + features[i]['name'] + '</option>'
    })
    $('#features option:gt(0)').remove();
    $('#features').append(new_features);

}
$(document).ready(function(){
    wfs_init();
});


/* Submit action */
$('#wfs_form').on('submit', function(e){
    e.preventDefault();
    var feature_name = $('#features').val();
    var i = features.length;
    while(i-- >0){
        if(features[i]['name'] == feature_name){
            $('#feature_title').html(features[i]['title']);
            $('#feature_abstract').html(features[i]['abstract']);
        }
    }

});