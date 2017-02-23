
SurveySpeciesFieldsVM = function (surveySettings) {
    var self = this;
    surveySettings = surveySettings || {};

    self.name = ko.observable(surveySettings.name);

    self.speciesFields = ko.observableArray();

    var speciesFields = surveySettings.fields || []
    for(var i=0; i<speciesFields.length; i++) {
        self.speciesFields.push(new SpeciesFieldViewModel(speciesFields[i]));
    }

}
/**
 * Created by mol109 on 16/2/17.
 */

function ProjectSpeciesFieldsConfigurationViewModel (project, speciesFieldsConfigBySurvey) {
    var self = this;

    self.init = function () {

        // Default species configuration
        self.species = ko.observable(new SpeciesConstraintViewModel(project.species));

        speciesFieldsConfigBySurvey = speciesFieldsConfigBySurvey || [];
        self.surveysConfig = ko.observableArray();

        // Surveys that don't have species fields but need to be listed separately.
        self.surveysWithoutFields = ko.observableArray();

        // Surveys that have at least one species fields
        self.surveysToConfigure = ko.observableArray();


        for(var i=0; i<speciesFieldsConfigBySurvey.length; i++) {
            var surveySpeciesFieldsVM = new SurveySpeciesFieldsVM(speciesFieldsConfigBySurvey[i]);
            self.surveysConfig.push(surveySpeciesFieldsVM);

            if(surveySpeciesFieldsVM.speciesFields().length > 0) {
                self.surveysToConfigure.push(surveySpeciesFieldsVM);
            } else {
                self.surveysWithoutFields.push(surveySpeciesFieldsVM);
            }
        }

        self.species().speciesDisplayFormat.subscribe(
            /**
             * Update the species display format for all species fields if they are using the default configuration
             */
            function (newSpeciesDisplayFormat) {

                // Check every field to see if it is using default config
                var surveys = self.surveysToConfigure()

                for(var i = 0; i < surveys.length; i++) {
                    var speciesFields = surveys[i].speciesFields()
                    for(var j = 0; j<speciesFields.length; j++) {
                        var speciesFieldConfig = speciesFields[j].config();
                        if (speciesFieldConfig.type() == 'DEFAULT_SPECIES') {
                            speciesFieldConfig.speciesDisplayFormat(newSpeciesDisplayFormat);
                        }
                    }
                }
            })
    }

    self.init();

    self.transients = self.transients || {};
    // self.transients.project = project;


    self.transients.availableSpeciesDisplayFormat = ko.observableArray([{
        id:'SCIENTIFICNAME(COMMONNAME)',
        name: 'Scientific name (Common name)'
    },{
        id:'COMMONNAME(SCIENTIFICNAME)',
        name: 'Common name (Scientific name)'
    },{
        id:'COMMONNAME',
        name: 'Common name'
    },{
        id:'SCIENTIFICNAME',
        name: 'Scientific name'
    }])


    self.goToProject = function () {
        if (self.projectId) {
            document.location.href = fcConfig.projectViewUrl + self.projectId();
        }
    };
    self.goToSite = function() {
        if (self.siteId) {
            document.location.href = fcConfig.siteViewUrl + self.siteId();
        }
    };


    self.save = function () {
        if ($('#validation-container').validationEngine('validate')) {
            var jsData = ko.mapping.toJS(self, {'ignore':['transients']});
            var json = JSON.stringify(jsData);
            $.ajax({
                url: projectUpdateUrl,
                type: 'POST',
                data: json,
                contentType: 'application/json',
                success: function (data) {
                    if (data.error) {
                        alert(data.detail + ' \n' + data.error);
                    } else {
                        document.location.href = returnTo;
                    }
                },
                error: function (data) {
                    var status = data.status;
                    alert('An unhandled error occurred: ' + data.status);
                }
            });
        }
    };
    self.removeActivity = function () {
        bootbox.confirm("Delete this entire activity? Are you sure?", function(result) {
            if (result) {
            }
        });
    };
    self.notImplemented = function () {
        alert("Not implemented yet.")
    };

    self.showSpeciesConfiguration = function(speciesConstraintVM, fieldName, surveyIndex,  speciesFieldIndex) {
        // Create a copy to bind to the field config dialog otherwise we may change the main screen values inadvertenly
        speciesConstraintVM = new SpeciesConstraintViewModel(speciesConstraintVM.asJson(), fieldName);

        if(speciesFieldIndex) {
            speciesConstraintVM.speciesOptions.push({id: 'DEFAULT_SPECIES', name:'Use default configuration'});
        }

        showSpeciesFieldConfigInModal(speciesConstraintVM, '#speciesFieldDialog')
            .done(function(result){
                    if(surveyIndex && speciesFieldIndex) { //Update a particular species field configuration
                        var newSpeciesConstraintVM = new SpeciesConstraintViewModel(result)
                        newSpeciesConstraintVM.speciesOptions.push({id: 'DEFAULT_SPECIES', name:'Use default configuration'});

                        // survey[i].speciesField[j]
                        var currentSpeciesField = self.surveysToConfigure()[surveyIndex()].speciesFields()[speciesFieldIndex()];
                        currentSpeciesField.config(newSpeciesConstraintVM);

                        // For all species fields if the type is changed to DEFAULT_SPECIES then the speciesDisplayFormat
                        // MUST be copied from the default configuration.
                        if(currentSpeciesField.config().type() == 'DEFAULT_SPECIES') {
                            currentSpeciesField.config().speciesDisplayFormat(self.species().speciesDisplayFormat());
                        }
                    }
                    else { // Update species default configuration
                        self.species(new SpeciesConstraintViewModel(result));
                    }
                }
            );
    }
}
