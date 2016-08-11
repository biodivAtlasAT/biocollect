<div class="row-fluid">
    <div class="span2 large-space-before">
        <ul id="adminNav" class="nav nav-tabs nav-stacked ">
            <g:if test="${fc.userInRole(role: grailsApplication.config.security.cas.alaAdminRole) || fc.userInRole(role: grailsApplication.config.security.cas.adminRole)}">
                <li ${activeClass}><a href="#settings" id="settings-tab" data-toggle="tab"><i class="icon-chevron-right"></i> Project settings</a></li>
                <g:set var="activeClass" value=""/>
            </g:if>
            <li><a href="#activity-settings" id="activity-settings-tab" data-toggle="tab"><i class="icon-chevron-right"></i> Activity Settings</a></li>
            <li><a href="#editMeriPlan" id="editMeriPlan-tab" data-toggle="tab"><i class="icon-chevron-right"></i> Edit Project Plan</a></li>
            <li><a href="#editProjectBlog" id="editProjectBlog-tab" data-toggle="tab"><i class="icon-chevron-right"></i> Edit Blog</a></li>
            <g:if test="${hasLegacyNewsAndEvents}">
                <li><a href="#editNewsAndEvents" id="editnewsandevents-tab" data-toggle="tab"><i class="icon-chevron-right"></i> News and events</a></li>
            </g:if>
            <g:if test="${hasLegacyProjectStories}">
                <li><a href="#editProjectStories" id="editprojectstories-tab" data-toggle="tab"><i class="icon-chevron-right"></i> Project stories</a></li>
            </g:if>
            <li ${activeClass}><a href="#permissions" id="permissions-tab" data-toggle="tab"><i class="icon-chevron-right"></i> Project access</a></li>
            <li><a href="#edit-documents" id="documents-tab" data-toggle="tab"><i class="icon-chevron-right"></i> Documents</a></li>
            <g:if test="${fc.userInRole(role: grailsApplication.config.security.cas.alaAdminRole) || fc.userInRole(role: grailsApplication.config.security.cas.adminRole) || user.isAdmin}">
                <li><a href="#project-audit" id="project-audit-tab" data-toggle="tab"><i class="icon-chevron-right"></i> Audit</a></li>
            </g:if>
        </ul>
    </div>
    <div class="span10">
        <div class="pill-content">
            <g:set var="activeClass" value="active"/>
            <!-- PROJECT SETTINGS -->
            <div id="settings" class="pill-pane ${activeClass}">
                <g:render template="editOrDeleteProject"/>
            </div>
            <g:set var="activeClass" value=""/>
            <!-- Activity settings -->
            <div id="activity-settings" class="pill-pane">
                <div class="row-fluid">
                    <div class="span12">
                        <ul id="ul-survey-constraint-citizen-science" class="nav nav-pills">
                            <li class="active"><a href="#species" id="species-tab" data-toggle="tab">Species</a></li>
                        </ul>

                        <div class="pill-content">
                            <div class="pill-pane active" id="species">
                                <g:render template="/species/species" model="[project:project, activityTypes:activityTypes]"/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="editMeriPlan" class="pill-pane">
                <h3>Edit Project Plan</h3>
                <g:render template="editMeriPlan"></g:render>
            </div>
            <div id="editProjectBlog" class="pill-pane">
                <h3>Edit Project Blog</h3>
                <g:render template="/blog/blogSummary" model="${[blog:project.blog?:[]]}"/>
            </div>

            <div id="editNewsAndEvents" class="pill-pane">
                <g:render template="editProjectContent" model="${[attributeName:'newsAndEvents', header:'News and events']}"/>
            </div>

            <div id="editProjectStories" class="pill-pane">
                <g:render template="editProjectContent" model="${[attributeName:'projectStories', header:'Project stories']}"/>
            </div>

            <div id="permissions" class="pill-pane ${activeClass}">
                <h3>Project Members</h3>
                <g:render template="/admin/addPermissions" model="[addUserUrl:g.createLink(controller:'user', action:'addUserAsRoleToProject'), entityId:project.projectId]"/>
                <g:render template="/admin/permissionTable" model="[loadPermissionsUrl:g.createLink(controller:'project', action:'getMembersForProjectId', id:project.projectId), removeUserUrl:g.createLink(controller:'user', action:'removeUserWithRoleFromProject'), entityId:project.projectId, user:user]"/>

            </div>
            <!-- DOCUMENTS -->
            <div id="edit-documents" class="pill-pane">
                <h3>Resources</h3>
                <div class="row-fluid">
                    <div class="span10">
                        <g:render template="/shared/editDocuments"
                                  model="[useExistingModel: true,editable:true, filterBy: 'all', ignore: '', imageUrl:resource(dir:'/images/filetypes'),containerId:'adminDocumentList']"/>
                    </div>
                </div>
                %{--The modal view containing the contents for a modal dialog used to attach a document--}%
                <g:render template="/shared/attachDocument"/>
                <div class="row-fluid attachDocumentModal">
                    <button class="btn btn-small btn-primary" id="doAttach" data-bind="click:attachDocument"><i class="icon-white icon-plus"></i> Attach Document</button>
                </div>
            </div>
            <!--AUDIT-->
            <g:if test="${fc.userInRole(role: grailsApplication.config.security.cas.alaAdminRole) || fc.userInRole(role: grailsApplication.config.security.cas.adminRole) || user.isAdmin}">
                <div id="project-audit" class="pill-pane">
                    <g:render template="/admin/auditProject"/>
                </div>
            </g:if>
        </div>
    </div>
</div>