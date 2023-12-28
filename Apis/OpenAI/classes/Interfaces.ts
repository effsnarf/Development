interface Tool {
  type: string;
  function: ToolFunction;
}

interface ToolFunction {
  name: string;
  description: string;
  parameters: FunctionParameters;
}

interface FunctionParameters {
  type: string;
  properties: any;
  required: string[];
}

interface ParameterDetails {
  type: string;
  description?: string;
  enum?: string[];
}

interface UnitParameterDetails extends ParameterDetails {
  enum: string[];
}

export { Tool };
