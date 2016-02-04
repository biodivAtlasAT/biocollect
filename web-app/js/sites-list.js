/*
 * Copyright (C) 2016 Atlas of Living Australia
 * All Rights Reserved.
 *
 * The contents of this file are subject to the Mozilla Public
 * License Version 1.1 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of
 * the License at http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS
 * IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing
 * rights and limitations under the License.
 * 
 * Created by Temi on 1/02/16.
 */
var availableFacets = [
    {name: 'siteProjectNameFacet', displayName: 'Project'},
    {name: 'siteSurveyNameFacet', displayName: 'Survey'},
    {name: 'photoType', displayName: 'Photo Type'},
    {name: 'typeFacet', displayName: 'Type'},
    {name: 'stateFacet', displayName: 'State / Territory'},
    {name: 'lgaFacet', displayName: 'Local Government Area'},
    {name: 'nrmFacet', displayName: 'Natural Resource Management'}
];

/**
 * view model for sites used to display gallery
 * @param params
 * @constructor
 */
function SitesListViewModel(params) {
    var self = this,
        config = $.extend({
            // can turn off initial load if set to false
            loadOnInit: true
        }, params);

    self.facets = ko.observableArray();
    self.sites = ko.observableArray();
    self.gallery = ko.observableArray();
    self.error = ko.observable();
    self.selectedFacets = ko.observableArray();
    self.searchTerm = ko.observable('')
    self.pagination = new PaginationViewModel(null,self)
    self.doNotLoad = ko.observable(false)


    /**
     * ajax call to load sites and initial list of photo points for each point of interest
     * @param offset
     */
    self.loadSites = function (offset) {
        if(!self.doNotLoad()){
            var params = self.constructQueryParams(offset);
            self.error('')
            $.ajax({
                url: fcConfig.listSitesUrl,
                data: params,
                traditional:true,
                success: function (data) {
                    if(data.sites){
                        data.sites = $.map(data.sites, function (site) {
                            return new SiteListViewModel(site)
                        });
                        self.sites(data.sites);
                        self.gallery(self.getAllSiteId(data.sites))
                    }

                    data.facets && self.createFacets(data.facets, availableFacets);

                    self.pagination.loadPagination(self.pagination.currentPage(), data.total)
                },
                error: function (xhr) {
                    self.error(xhr.responseText);

                }
            })
        }
    }

    /**
     * get siteId as an array.
     * @param sites
     * @returns {Array}
     */
    self.getAllSiteId = function(sites){
        var results = []
        sites.forEach(function(site){
            results.push(site.siteId())
        })
        return results
    }

    /**
     * function to extracts facets and insert them in the order provided by facetOrder parameter.
     * Note: Only facets in facetOrder parameter is included, others are ignored.
     * @param facets
     * @param facetsOrder
     */

    self.createFacets = function (facets, facetsOrder) {
        if (!facets || !facetsOrder) {
            return;
        }
        var results = []

        facets = $.map(facets, function (facet) {
            return new FacetViewModel(facet);
        })

        facetsOrder.forEach(function (metadata) {
            var result = self.find(facets, 'name', metadata.name)
            if (result) {
                result.metadata = metadata
                results.push(result)
            }
        });
        self.facets(results);
    }

    self.find = function (items, prop, value) {
        for (var i = 0; i < items.length; i++) {
            if (items[i][prop]() == value) {
                return items[i];
            }
        }
    }

    /**
     * creates an object what will be sent as parameters
     * @param tOffset
     * @returns {{max: *, offset: *, query: *, fq: *}}
     */
    self.constructQueryParams = function(tOffset){
        var offset

        if(tOffset != undefined || tOffset != null){
            offset = tOffset
        } else {
            offset = self.pagination.calculatePageOffset(self.pagination.currentPage()+1);
        }

        var params = {
            max: self.pagination.resultsPerPage(),
            offset: offset,
            query: self.searchTerm(),
            fq: $.map(self.selectedFacets(), function(fq){
                return fq.getQueryText();
            })
        }
        return params;
    }


    /**
     * clears result list
     */
    self.reset = function(){
        self.sites.removeAll();
        self.facets.removeAll();
        self.doNotLoad(true);
        self.selectedFacets.removeAll()
        self.searchTerm('')
        self.doNotLoad(false);
        self.pagination.first()
    }

    /**
     * used by pagination view model. called to inform a change to page number or pagesize.
     * @param offset
     */
    self.refreshPage = function(offset){
        self.loadSites(offset);
    }

    self.addFacetTerm = function(term){
        self.selectedFacets.push(term)
    }

    self.removeFacetTerm = function(term){
        self.selectedFacets.remove(term);
    }

    self.clearError = function(){
        self.error('');
    }

    self.clearErrorWithDelay = function(){
        if(self.error()){
            var delay = config.delay || 5000;
            setTimeout(self.clearError, delay)
        }
    }

    self.selectedFacets.subscribe(self.pagination.first);
    self.searchTerm.subscribe(self.pagination.first);
    self.error.subscribe(self.clearErrorWithDelay);

    config.loadOnInit && (self.pagination.loadPagination(1,0) || self.pagination.first())
}

function SiteListViewModel(prop) {
    var self = this;
    self.name = ko.observable(prop.name);
    self.siteId = ko.observable(prop.siteId);
    self.lastUpdated = ko.observable(prop.lastUpdated);
    self.description = ko.observable(prop.description);
    self.numberOfProjects = ko.observable(prop.numberOfProjects);
    self.numberOfPoi = ko.observable(prop.numberOfPoi);
    self.type = ko.observable(prop.type);
    self.extent = prop.extent;

    /**
     * constructs url to site
     * @returns {string}
     */
    self.getSiteUrl = function () {
        return fcConfig.viewSiteUrl + '/' + self.siteId();
    }
}

function FacetViewModel(facet) {
    var self = this;
    if (!facet) facet = {};

    self.name = ko.observable(facet.name);
    self.total = ko.observable(facet.total);
    self.terms = ko.observableArray();
    self.filter = ko.observable(false);

    var terms = $.map(facet.terms ? facet.terms : [], function (term, index) {
        term.facet = self;
        return new FacetTermViewModel(term);
    });

    self.terms(terms);
};

function FacetTermViewModel(term) {
    var self = this;
    if (!term) term = {};

    self.selected = ko.observable(false);
    self.facet = term.facet;
    self.count = ko.observable(term.count);
    self.term = ko.observable(term.term);
    self.displayName = ko.computed(function(){
       return decodeCamelCase(self.term()) || 'Unknown';
    });
    self.showTerm = ko.observable(term.showTerm || true);
    self.id = ko.observable(generateTermId(self));

    /**
     * constructs a facet term so that it can be passed as fq value.
     * @returns {string}
     */
    self.getQueryText = function(){
        return self.facet.name() +':'+ self.term();
    }
};

function generateTermId(term) {
    var name, term
    name = term.facet.name()
    term = term.term()
    return name.replace(/[^a-zA-Z0-9]/g, "") + term.replace(/[^a-zA-Z0-9]/g, "")
}