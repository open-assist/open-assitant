import { XML } from "$/utils/xml.ts";
import { assertEquals } from "@std/assert";

const obj = [
  {
    type: "function",
    function: {
      name: "get_current_weather",
      description: "Get the current weather",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city and state, e.g. San Francisco, CA",
          },
          format: {
            type: "string",
            enum: ["celsius", "fahrenheit"],
            description: "The temperature unit to use. Infer this from the users location.",
          },
        },
        required: ["location", "format"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_n_day_weather_forecast",
      description: "Get an N-day weather forecast",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city and state, e.g. San Francisco, CA",
          },
          format: {
            type: "string",
            enum: ["celsius", "fahrenheit"],
            description: "The temperature unit to use. Infer this from the users location.",
          },
          num_days: {
            type: "integer",
            description: "The number of days to forecast",
          },
        },
        required: ["location", "format", "num_days"],
      },
    },
  },
];
const xml = `<tool>
  <type>function</type>
  <function>
    <name>get_current_weather</name>
    <description>Get the current weather</description>
    <parameters>
      <type>object</type>
      <properties>
        <location>
          <type>string</type>
          <description>The city and state, e.g. San Francisco, CA</description>
        </location>
        <format>
          <type>string</type>
          <enum>celsius</enum>
          <enum>fahrenheit</enum>
          <description>The temperature unit to use. Infer this from the users location.</description>
        </format>
      </properties>
      <required>location</required>
      <required>format</required>
    </parameters>
  </function>
</tool>
<tool>
  <type>function</type>
  <function>
    <name>get_n_day_weather_forecast</name>
    <description>Get an N-day weather forecast</description>
    <parameters>
      <type>object</type>
      <properties>
        <location>
          <type>string</type>
          <description>The city and state, e.g. San Francisco, CA</description>
        </location>
        <format>
          <type>string</type>
          <enum>celsius</enum>
          <enum>fahrenheit</enum>
          <description>The temperature unit to use. Infer this from the users location.</description>
        </format>
        <num_days>
          <type>integer</type>
          <description>The number of days to forecast</description>
        </num_days>
      </properties>
      <required>location</required>
      <required>format</required>
      <required>num_days</required>
    </parameters>
  </function>
</tool>
`;

Deno.test("XML.strigify", () => {
  assertEquals(XML.stringify(obj, { arrayNodeName: "tool", format: true }), xml);
});

Deno.test("XML.parse", () => {
  assertEquals(XML.parse(xml), { tool: obj });
});
