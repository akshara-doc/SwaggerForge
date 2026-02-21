import * as XLSX from 'xlsx';

const downloadFile = (content: BlobPart, fileName: string, contentType: string) => {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export interface Endpoint {
  path: string;
  method: string;
  summary: string;
  parameters: any[];
  responses: any;
  requestBody?: any;
  operationId?: string;
  tags?: string[];
}

export interface TestCase {
  'Test Case ID': string;
  'Endpoint': string;
  'Method': string;
  'Test Scenario': string;
  'Test Steps': string;
  'Prerequisite': string;
  'Test Data': string;
  'Expected Result': string;
  'Actual Result': string;
  'Status': string;
}

export function parseSwagger(data: any): Endpoint[] {
  const endpoints: Endpoint[] = [];
  const paths = data.paths || {};

  Object.keys(paths).forEach((path) => {
    Object.keys(paths[path]).forEach((method) => {
      const op = paths[path][method];
      endpoints.push({
        path,
        method: method.toUpperCase(),
        summary: op.summary || op.description || `${method.toUpperCase()} ${path}`,
        parameters: op.parameters || [],
        responses: op.responses || {},
        requestBody: op.requestBody,
        operationId: op.operationId,
        tags: op.tags,
      });
    });
  });

  return endpoints;
}

function resolveRef(ref: string, fullDoc: any): any {
  if (!ref || !fullDoc) return null;
  const parts = ref.replace(/^#\//, '').split('/');
  let current = fullDoc;
  for (const part of parts) {
    if (current[part] === undefined) return null;
    current = current[part];
  }
  return current;
}

function generateSampleJson(schema: any, fullDoc: any, seenRefs = new Set<string>()): string {
  if (!schema) return '';
  
  const generate = (s: any): any => {
    if (!s) return null;

    // Handle $ref
    if (s.$ref) {
      if (seenRefs.has(s.$ref)) return {}; // Prevent infinite recursion
      const resolved = resolveRef(s.$ref, fullDoc);
      if (resolved) {
        seenRefs.add(s.$ref);
        const result = generate(resolved);
        seenRefs.delete(s.$ref);
        return result;
      }
      return {};
    }

    // Handle allOf (merge properties)
    if (s.allOf) {
      let combined: any = {};
      s.allOf.forEach((sub: any) => {
        const generated = generate(sub);
        if (typeof generated === 'object') {
          combined = { ...combined, ...generated };
        }
      });
      return combined;
    }

    // Handle oneOf/anyOf (just pick the first one)
    if (s.oneOf || s.anyOf) {
      return generate((s.oneOf || s.anyOf)[0]);
    }

    if ((s.type === 'object' || !s.type) && s.properties) {
      const obj: any = {};
      Object.keys(s.properties).forEach(key => {
        obj[key] = generate(s.properties[key]);
      });
      return obj;
    }
    
    if (s.type === 'array' && s.items) {
      return [generate(s.items)];
    }
    
    if (s.example !== undefined) return s.example;
    if (s.default !== undefined) return s.default;
    
    switch (s.type) {
      case 'string': 
        if (s.format === 'date-time') return new Date().toISOString();
        if (s.format === 'date') return new Date().toISOString().split('T')[0];
        if (s.format === 'email') return 'user@example.com';
        if (s.format === 'uuid') return '123e4567-e89b-12d3-a456-426614174000';
        if (s.format === 'uri') return 'https://example.com';
        if (s.enum) return s.enum[0];
        return 'sample_string';
      case 'number':
      case 'integer': return 0;
      case 'boolean': return true;
      default: return null;
    }
  };

  try {
    const sample = generate(schema);
    return JSON.stringify(sample, null, 2);
  } catch (e) {
    console.error('Error generating sample JSON:', e);
    return 'Check Swagger Schema';
  }
}

export function generateTestCases(endpoints: Endpoint[], fullDoc: any): TestCase[] {
  const testCases: TestCase[] = [];
  let idCounter = 1;

  endpoints.forEach((ep) => {
    const successStatus = ep.method === 'POST' ? '201 Created' : '200 OK';
    
    // 1. Positive Case: Successful Request
    let testData = 'Valid parameters as per Swagger spec';
    if (ep.requestBody?.content?.['application/json']?.schema) {
      const sample = generateSampleJson(ep.requestBody.content['application/json'].schema, fullDoc);
      testData = `Request Body:\n${sample}`;
    } else if (ep.parameters.length > 0) {
      testData = `Query/Path Params: ${ep.parameters.map(p => `${p.name}=${p.example || 'value'}`).join(', ')}`;
    }

    testCases.push({
      'Test Case ID': `TC-${idCounter++}`,
      'Endpoint': ep.path,
      'Method': ep.method,
      'Test Scenario': `Verify successful ${ep.method} request to ${ep.path}`,
      'Test Steps': `1. Prepare ${ep.method} request for ${ep.path}\n2. Send request with valid parameters/body\n3. Verify response status and body`,
      'Prerequisite': 'API Service is up and running',
      'Test Data': testData,
      'Expected Result': `Response status should be ${successStatus} and body should contain expected fields.`,
      'Actual Result': '',
      'Status': '',
    });

    // 2. Negative Case: Unauthorized Access (Generic)
    testCases.push({
      'Test Case ID': `TC-${idCounter++}`,
      'Endpoint': ep.path,
      'Method': ep.method,
      'Test Scenario': `Verify ${ep.method} request to ${ep.path} without authentication`,
      'Test Steps': `1. Prepare ${ep.method} request for ${ep.path}\n2. Send request without Auth token\n3. Verify response status`,
      'Prerequisite': 'Endpoint requires authentication',
      'Test Data': 'No Auth Header',
      'Expected Result': 'Response status should be 401 Unauthorized.',
      'Actual Result': '',
      'Status': '',
    });

    // 3. Negative Case: Missing Mandatory Fields
    const mandatoryParams = ep.parameters.filter((p) => p.required);
    if (mandatoryParams.length > 0) {
      testCases.push({
        'Test Case ID': `TC-${idCounter++}`,
        'Endpoint': ep.path,
        'Method': ep.method,
        'Test Scenario': `Verify ${ep.method} request to ${ep.path} with missing mandatory parameters`,
        'Test Steps': `1. Prepare ${ep.method} request for ${ep.path}\n2. Remove mandatory parameter: ${mandatoryParams[0].name}\n3. Send request\n4. Verify error response`,
        'Prerequisite': 'API Service is up and running',
        'Test Data': `Missing ${mandatoryParams[0].name}`,
        'Expected Result': 'Response status should be 400 Bad Request with validation error message.',
        'Actual Result': '',
        'Status': '',
      });
    }

    // 4. POST Specific: Invalid Content Type
    if (ep.method === 'POST' || ep.method === 'PUT' || ep.method === 'PATCH') {
      testCases.push({
        'Test Case ID': `TC-${idCounter++}`,
        'Endpoint': ep.path,
        'Method': ep.method,
        'Test Scenario': `Verify ${ep.method} request to ${ep.path} with unsupported Content-Type`,
        'Test Steps': `1. Prepare ${ep.method} request for ${ep.path}\n2. Set Content-Type to 'text/plain'\n3. Send request\n4. Verify error response`,
        'Prerequisite': 'API Service is up and running',
        'Test Data': 'Content-Type: text/plain',
        'Expected Result': 'Response status should be 415 Unsupported Media Type.',
        'Actual Result': '',
        'Status': '',
      });

      testCases.push({
        'Test Case ID': `TC-${idCounter++}`,
        'Endpoint': ep.path,
        'Method': ep.method,
        'Test Scenario': `Verify ${ep.method} request to ${ep.path} with malformed JSON body`,
        'Test Steps': `1. Prepare ${ep.method} request for ${ep.path}\n2. Provide malformed JSON string in body\n3. Send request\n4. Verify error response`,
        'Prerequisite': 'API Service is up and running',
        'Test Data': '{ "invalid": json }',
        'Expected Result': 'Response status should be 400 Bad Request.',
        'Actual Result': '',
        'Status': '',
      });
    }

    // 5. Edge Case: Invalid Data Types
    testCases.push({
      'Test Case ID': `TC-${idCounter++}`,
      'Endpoint': ep.path,
      'Method': ep.method,
      'Test Scenario': `Verify ${ep.method} request to ${ep.path} with invalid data types`,
      'Test Steps': `1. Prepare ${ep.method} request for ${ep.path}\n2. Provide string where integer is expected (or vice versa)\n3. Send request\n4. Verify error response`,
      'Prerequisite': 'API Service is up and running',
      'Test Data': 'Invalid data types for parameters',
      'Expected Result': 'Response status should be 400 Bad Request or 422 Unprocessable Entity.',
      'Actual Result': '',
      'Status': '',
    });
  });

  return testCases;
}

export function generateExcel(testCases: TestCase[]) {
  const worksheet = XLSX.utils.json_to_sheet(testCases);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Cases');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  downloadFile(excelBuffer, 'API_Test_Cases.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

export function generatePostman(endpoints: Endpoint[], name: string = 'Swagger Collection') {
  // Group endpoints by tags for folder structure
  const folders: Record<string, any[]> = {};
  const rootItems: any[] = [];

  endpoints.forEach((ep) => {
    const tag = ep.tags?.[0] || 'General';
    if (!folders[tag]) folders[tag] = [];
    
    // Build validation scripts
    const testScripts = [
      `pm.test("Status code is 200/201", function () {`,
      `    pm.expect(pm.response.code).to.be.oneOf([200, 201]);`,
      `});`,
      `pm.test("Response time is less than 800ms", function () {`,
      `    pm.expect(pm.response.responseTime).to.be.below(800);`,
      `});`,
      `pm.test("Response is valid JSON", function () {`,
      `    pm.response.to.be.withBody;`,
      `    pm.response.to.be.json;`,
      `});`
    ];

    // Add schema validation if possible
    const successResponse = ep.responses['200'] || ep.responses['201'];
    if (successResponse?.content?.['application/json']?.schema) {
      testScripts.push(
        `pm.test("Response schema is valid", function () {`,
        `    var schema = ${JSON.stringify(successResponse.content['application/json'].schema)};`,
        `    pm.response.to.have.jsonSchema(schema);`,
        `});`
      );
    }

    const item = {
      name: ep.summary,
      request: {
        method: ep.method,
        header: [
          { key: "Content-Type", value: "application/json" }
        ],
        url: {
          raw: `{{baseUrl}}${ep.path}`,
          host: ['{{baseUrl}}'],
          path: ep.path.split('/').filter(Boolean),
        },
        description: ep.summary,
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: testScripts,
            type: 'text/javascript',
          },
        },
      ],
    };

    folders[tag].push(item);
  });

  const collection = {
    info: {
      name,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: Object.keys(folders).map(tag => ({
      name: tag,
      item: folders[tag]
    })),
  };

  const json = JSON.stringify(collection, null, 2);
  downloadFile(json, 'Postman_Collection.json', 'application/json');
}

export function generateSoapUIXML(endpoints: Endpoint[]) {
  const projectId = `Project_${Math.random().toString(36).substr(2, 9)}`;
  const interfaceId = `Interface_${Math.random().toString(36).substr(2, 9)}`;
  const testSuiteId = `TestSuite_${Math.random().toString(36).substr(2, 9)}`;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<con:soapui-project id="${projectId}" activeEnvironment="Default" name="Swagger_Automation_Project" resourceRoot="" soapui-version="5.6.0" xmlns:con="http://eviware.com/soapui/config">
  <con:interface xsi:type="con:RestService" id="${interfaceId}" name="REST Service" type="rest" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <con:definitionCache type="TEXT" rootPart=""/>
    <con:endpoints>
      <con:endpoint>http://localhost:8080</con:endpoint>
    </con:endpoints>
    ${endpoints.map(ep => {
      const resourceId = `Res_${Math.random().toString(36).substr(2, 5)}`;
      const methodId = `Meth_${Math.random().toString(36).substr(2, 5)}`;
      return `
    <con:resource name="${ep.path}" path="${ep.path}" id="${resourceId}">
      <con:method name="${ep.method}" id="${methodId}" method="${ep.method}">
        <con:request name="Request 1" id="${Math.random().toString(36).substr(2, 9)}" mediaType="application/json">
          <con:settings/>
          <con:endpoint>http://localhost:8080</con:endpoint>
          <con:parameters/>
        </con:request>
      </con:method>
    </con:resource>`;
    }).join('')}
  </con:interface>

  <con:testSuite id="${testSuiteId}" name="Automation TestSuite">
    <con:settings/>
    <con:runType>SEQUENTIAL</con:runType>
    ${endpoints.map(ep => {
      const testCaseId = `TC_${Math.random().toString(36).substr(2, 5)}`;
      const stepId = `Step_${Math.random().toString(36).substr(2, 5)}`;
      return `
    <con:testCase id="${testCaseId}" failOnError="true" inheritOptions="true" name="${ep.summary}" keepSession="false" maxResults="0" searchProperties="true">
      <con:settings/>
      <con:testStep type="restrequest" name="${ep.method} Request" id="${stepId}">
        <con:settings/>
        <con:config service="REST Service" resourcePath="${ep.path}" methodName="${ep.method}" xsi:type="con:RestRequestStep" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
          <con:restRequest name="${ep.method} Request" id="${Math.random().toString(36).substr(2, 9)}" mediaType="application/json">
            <con:settings/>
            <con:endpoint>http://localhost:8080</con:endpoint>
            <con:request/>
            <con:assertion type="Valid HTTP Status Codes" name="Valid HTTP Status Codes" id="${Math.random().toString(36).substr(2, 9)}">
              <con:configuration>
                <codes>200,201</codes>
              </con:configuration>
            </con:assertion>
            <con:assertion type="Response SLA Assertion" name="Response SLA" id="${Math.random().toString(36).substr(2, 9)}">
              <con:configuration>
                <SLA>1000</SLA>
              </con:configuration>
            </con:assertion>
            <con:assertion type="JSON Path Match" name="Check for Content" id="${Math.random().toString(36).substr(2, 9)}">
              <con:configuration>
                <path>$</path>
                <content>*</content>
                <allowWildcards>true</allowWildcards>
              </con:configuration>
            </con:assertion>
            <con:credentials>
              <con:authType>No Authorization</con:authType>
            </con:credentials>
            <con:jmsConfig JMSDeliveryMode="PERSISTENT"/>
            <con:parameters/>
          </con:restRequest>
        </con:config>
      </con:testStep>
      <con:properties/>
    </con:testCase>`;
    }).join('')}
  </con:testSuite>

  <con:properties/>
  <con:wssContainer/>
  <con:oAuth2ProfileContainer/>
  <con:oAuth1ProfileContainer/>
</con:soapui-project>`;

  downloadFile(xml, 'SoapUI_Project.xml', 'application/xml');
}

export function generatePythonScripts(endpoints: Endpoint[]) {
  let script = `import requests
import unittest

BASE_URL = "http://localhost:8080"

class TestAPI(unittest.TestCase):
`;

  endpoints.forEach((ep, index) => {
    const methodName = ep.summary.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() || `test_endpoint_${index}`;
    script += `
    def test_${methodName}(self):
        """${ep.summary}"""
        url = f"{BASE_URL}${ep.path}"
        response = requests.request("${ep.method}", url)
        self.assertIn(response.status_code, [200, 201])
        print(f"Tested {ep.path} - Status: {response.status_code}")
`;
  });

  script += `
if __name__ == "__main__":
    unittest.main()
`;

  downloadFile(script, 'api_automation_tests.py', 'text/x-python');
}
