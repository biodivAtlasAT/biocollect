package au.org.ala.biocollect

import groovyx.net.http.HTTPBuilder
import groovyx.net.http.Method
import org.apache.http.entity.mime.HttpMultipartMode
import org.apache.http.entity.mime.MultipartEntity
import org.apache.http.entity.mime.content.ByteArrayBody
import org.apache.http.entity.mime.content.InputStreamBody
import org.apache.http.entity.mime.content.StringBody
import org.apache.http.entity.mime.content.FileBody
import java.nio.charset.StandardCharsets

class UtilService {

    /**
     * Post a HTTP multipart/form-data request to external web sites.
     * @param url the URL to forward to.
     * @param params the (string typed) HTTP parameters to be attached.
     * @inputStreanMap [contentIn: <Input Stream>, contentInfo: [contentType: <content type for eg. json string, zip>, contentName: <can be file name or any name given to the content>]]
     * @return [status:<request status>, content:<The response content from the server, assumed to be JSON>
     */
    def postMultipart(url, Map params, List<Map> inputStreamListMap, String authenticationKey = null) {

        def result = [:]

        HTTPBuilder builder = new HTTPBuilder(url)
        builder.request(Method.POST) { request ->
            requestContentType : 'multipart/form-data'
            MultipartEntity content = new MultipartEntity(HttpMultipartMode.BROWSER_COMPATIBLE)

            inputStreamListMap.each {
                Map contentInfo = it.contentInfo
                if (it.contentIn && contentInfo.contentType == "application/zip") {
                    content.addPart(contentInfo.contentName, new ByteArrayBody(it.contentIn, contentInfo.contentType, contentInfo.contentName + ".zip"))
                    //content.addPart(contentInfo.contentName, new FileBody(it.contentIn, contentInfo.contentType))
                } else if (it.contentIn && contentInfo.contentType == "application/json") {
                    content.addPart(contentInfo.contentName, new StringBody(it.contentIn, contentInfo.contentType, StandardCharsets.UTF_8))
                }
            }
            params.each { key, value ->
                if (value) {
                    content.addPart(key, new StringBody(value.toString()))
                }
            }

            if (authenticationKey) {
                def encoded = authenticationKey.bytes.encodeBase64().toString()
                headers["Authorization"] = "Basic " + encoded
            }

            request.setEntity(content)

            response.success = {resp, message ->
                result.status = resp.status
                result.content = message
            }

            response.failure = {resp ->
                result.status = resp.status
                result.error = "Error POSTing to ${url}"
            }
        }
        result
    }
}