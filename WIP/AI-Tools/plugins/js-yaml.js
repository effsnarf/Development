import jsYaml from 'js-yaml';

export default ({ app }, inject) => {
    inject('jsYaml', jsYaml);
  };

  