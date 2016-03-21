package au.org.ala.biocollect

import au.org.ala.biocollect.merit.MetadataService
import au.org.ala.biocollect.merit.ProjectService
import au.org.ala.biocollect.merit.SearchService
import au.org.ala.biocollect.merit.UserService
import au.org.ala.biocollect.merit.WebService
import org.codehaus.groovy.grails.commons.GrailsApplication

class OrganisationService {

    private static final String ORGANISATION_DOCUMENT_FILTER = "className:au.org.ala.ecodata.Organisation"

    GrailsApplication grailsApplication
    WebService webService
    MetadataService metadataService
    ProjectService projectService
    UserService userService
    SearchService searchService
    OrganisationService organisationService


    Map get(String id, view = '') {

        def url = "${grailsApplication.config.ecodata.service.url}/organisation/$id?view=$view"
        webService.getJson(url)
    }

    Map getByName(orgName) {
        // The result of the service call will be a JSONArray if it's successful
        return list().list.find({ it.name == orgName })
    }

    String getNameFromId(orgId) {
        // The result of the service call will be a JSONArray if it's successful
        return orgId ? list().list.find({ it.organisationId == orgId })?.name : ''
    }

    def list() {
        metadataService.organisationList()
    }

    def validate(props, organisationId) {
        def error = null
        def notUpdating = !organisationId

        if (!notUpdating) {
            def org = get(organisationId)
            if (org?.error) {
                return "invalid organisationId"
            }
        }

        if (notUpdating && !props?.description) {
            //error, no start date
            return "description is missing"
        }

        if (props.containsKey("name")) {
            def proj = getByName(props.name)
            if (proj && (notUpdating || proj?.organisationId != organisationId)) {
                return "name is not unique"
            }
        } else if (notUpdating) {
            //error, no project name
            return "name is missing"
        }

        error
    }

    Map update(id, organisation) {
        Map result = [:]

        //validate
        def error = validate(organisation, id)
        if (error) {
            result.error = error
            result.detail = ''
        } else {
            String url = "${grailsApplication.config.ecodata.service.url}/organisation/$id"
            result = webService.doPost(url, organisation)
            metadataService.clearOrganisationList()
        }
        result

    }

    boolean isUserAdminForOrganisation(organisationId) {
        boolean userIsAdmin

        if (!userService.user) {
            return false
        }
        if (userService.userIsSiteAdmin()) {
            userIsAdmin = true
        } else {
            userIsAdmin = userService.isUserAdminForOrganisation(userService.user.userId, organisationId)
        }

        userIsAdmin
    }

    /**
     * Get the list of users (members) who have any level of permission for the requested organisationId
     *
     * @param organisationId the organisationId of interest.
     */
    List getMembersOfOrganisation(organisationId) {
        String url = grailsApplication.config.ecodata.service.url + "/permissions/getMembersForOrganisation/${organisationId}"
        webService.getJson(url)
    }

    /**
     * Adds a user with the supplied role to the identified organisation.
     * Adds the same user with the same role to all of the organisation's projects.
     *
     * @param userId the id of the user to add permissions for.
     * @param organisationId the organisation to add permissions for.
     * @param role the role to assign to the user.
     */
    Map addUserAsRoleToOrganisation(String userId, String organisationId, String role) {

        Map organisation = get(organisationId, 'flat')
        Map resp = userService.addUserAsRoleToOrganisation(userId, organisationId, role)
        organisation.projects.each {
            userService.addUserAsRoleToProject(userId, it.projectId, role)
        }
        resp
    }

    /**
     * Removes the user access with the supplied role from the identified organisation.
     * Removes the same user from all of the organisation's projects.
     *
     * @param userId the id of the user to remove permissions for.
     * @param organisationId the organisation to remove permissions for.

     */
    def removeUserWithRoleFromOrganisation(String userId, String organisationId, String role) {
        Map organisation = get(organisationId, 'flat')
        Map result = userService.removeUserWithRoleFromOrganisation(userId, organisationId, role)
        organisation.projects.each {
            userService.removeUserWithRole(it.projectId, userId, role)
        }
        result
    }

    Map search(Integer offset = 0, Integer max = 100, String searchTerm = null, String sort = null, String user = null) {
        Map params = [
                offset:offset,
                max:max,
                query:searchTerm,
                fq:ORGANISATION_DOCUMENT_FILTER
        ]

        if(user){
            if(params.fq){
                params.fq = [ params.fq ]
            } else {
                params.fq = []
            }

            params.fq.push("users:${user}")
        }

        if (sort) {
            params.sort = sort
        }
        Map results = searchService.fulltextSearch(
                params, true // Don't use the default facet query because organisations won't match it
        )
        results
    }

}
