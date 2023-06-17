<template>
  <mg2-app />
</template>

<script>
export default {
  layout: "base",
  name: "IndexPage",
  async asyncData({$content, params}) {
    let getTitle = async (url) => {
      let parts = url.split(`/`);

      if (parts[0] == `instance`)
      {
        let instanceID = parseInt(parts[1]);
        let url = `https://api.memegenerator.net/Instance_Select?instanceID=${instanceID}`;
        let instance = (await (await fetch(url)).json()).result;
        return [[instance?.text0, instance?.text1].filter(s => s).join(` `), instance?.displayName].join(` - `);
      }
      else if (parts[0] == `category`)
      {
        let categoryName = parts[1];
        categoryName = categoryName.replaceAll(`-`, ` `);
        return categoryName;
      }
      else // /Generator
      {
        let urlName = parts[0];
        let displayName = urlName.replaceAll(`-`, ` `);
        return displayName;
      }
    }

    let getImageUrl = async (url) => {
      let parts = url.split(`/`);

      if (parts[0] == `instance`)
      {
        let instanceID = parseInt(parts[1]);
        let imageUrl = `https://img.memegenerator.net/instances/${instanceID}.jpg`;
        return imageUrl;
      }
      else // /Generator
      {
        let urlName = parts[0];
        let apiUrl = `https://api.memegenerator.net/Generator_Select_ByUrlNameOrGeneratorID?generatorID=&urlName=${urlName}&apiKey=demo`;
        let json = (await (await fetch(apiUrl)).json());
        let generator = json.result;
        let imageUrl = `https://img.memegenerator.net/images/${generator.imageID}.jpg`;
        return imageUrl;
      }
    }

    let title = [(await getTitle(params.pathMatch)), `Meme Generator`].filter(s => s).join(` - `);

    let imageUrl = (await getImageUrl(params.pathMatch));

    return {
      page: {
        title: title,
        meta: [
          { property: 'og:title', content: title },
          { property: 'og:image', content: imageUrl }
        ]
      }
    }
  },
  head()
  {
    return {
      title: this.page.title,
      meta: this.page.meta
    };
  }
};
</script>
