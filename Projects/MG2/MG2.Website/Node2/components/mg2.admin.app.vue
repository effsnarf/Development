<template lang="pug">
    div.app
        h2 Admin
        div.bars
            div.bar(v-if="users")
                admin-number(:number="users.online[1].value", icon="👥", :text="`🕐 users (1min)`")
                admin-number(:number="users.online[5].value", icon="👥", :text="`🕐 users (5min)`")
                admin-number(:number="users.online[30].value", icon="👥", :text="`🕐 users (30min)`")
                admin-number(:number="users.online.day.value", icon="👥", :text="`🕐 users (1 day)`")
            div.bar
                admin-chart2(:chart="requests.count[60].value")
                admin-chart2(:chart="requests.count.day.value")
            div.bar
                //admin-number(:number="pageviews?.value", icon="📄", text="pageviews")
                admin-chart2(:chart="visits.count[60].value")
                admin-chart2(:chart="visits.count.day.value")
            div.bar
                admin-chart2(:chart="events.count[60].value")
                admin-chart2(:chart="events.count.day.value")
                //admin-number.opacity-50(:number="events?.value", icon="", text="events")
            div.bar
                admin-chart2(:chart="visits.time[60].value")
                admin-chart2(:chart="visits.time.day.value")
            div.bar
                admin-chart2(:chart="instances.count[60].value")
                admin-chart2(:chart="instances.count.day.value")
                admin-chart2(:chart="instances.count.week.value")
            div.bar
                admin-chart2(:chart="instances.count.month.value")
                admin-chart2(:chart="instances.count.year.value")
                admin-chart2(:chart="instances.count.decade.value")
            div.bar
                div
                    admin-chart(:total="getMax(queries.long?.value?.map(a => a.elp))", :data="queries.long?.value?.map(a => a.elp)", header="Queries", :title="`max (ms)`", icon="🕐")
                    admin-table(style="min-width: 30em;", :data="queries.long?.value?.map(a => {return {elapsed: a.elp, entity: a.v.args[0], pipeline: a.v.args[1] };})", :title="`🕐 long queries (ms)`", icon="❔🕐")
    </template>
    
    <script>
    import { Refreshing } from '../../../../../Shared/Refreshing';
    
    export default {
        data() {
            return {
                baseUrl: "https://memegenerator.net",
                sinceMinutes: 30,
                instances: {
                    count: {
                        60: new Refreshing(async () => JSON.parse(await (await fetch(`${this.baseUrl}/api/instances/60/1`)).text()), 5000),
                        day: new Refreshing(async () => JSON.parse(await (await fetch(`${this.baseUrl}/api/instances/1440/60`)).text()), 5000),
                        week: new Refreshing(async () => JSON.parse(await (await fetch(`${this.baseUrl}/api/instances/10080/60`)).text()), 50000),
                        month: new Refreshing(async () => JSON.parse(await (await fetch(`${this.baseUrl}/api/instances/43200/720`)).text()), 50000),
                        year: new Refreshing(async () => JSON.parse(await (await fetch(`${this.baseUrl}/api/instances/525600/11520`)).text()), 50000),
                        decade: new Refreshing(async () => JSON.parse(await (await fetch(`${this.baseUrl}/api/instances/5256000/129600`)).text()), 50000),
                    }
                },
                users: {
                    online: {
                        1: new Refreshing((async () => JSON.parse(await (await fetch(`${this.baseUrl}/api/users/online/1`)).text())).bind(this), 5000),
                        5: new Refreshing(async () => JSON.parse(await (await fetch(`${this.baseUrl}/api/users/online/5`)).text()), 5000),
                        30: new Refreshing(async () => JSON.parse(await (await fetch(`${this.baseUrl}/api/users/online/30`)).text()), 1000 * 60 * 1),
                        day: new Refreshing(async () => JSON.parse(await (await fetch(`${this.baseUrl}/api/users/online/1440`)).text()), 1000 * 60 * 1),
                    },
                },
                visits: {
                    count: {
                        60: new Refreshing(async () => JSON.parse(await (await fetch(`${this.baseUrl}/api/visits/count/60/1`)).text()), 1000 * 60 * 1),
                        day: new Refreshing(async () => JSON.parse(await (await fetch(`${this.baseUrl}/api/visits/count/1440/10`)).text()), 1000 * 60 * 1)
                    },
                    time: {
                        60: new Refreshing(async () => JSON.parse(await (await fetch(`${this.baseUrl}/api/visits/time/60/1`)).text()), 1000 * 60 * 1),
                        day: new Refreshing(async () => JSON.parse(await (await fetch(`${this.baseUrl}/api/visits/time/1440/60`)).text()), 1000 * 60 * 1)
                    }
                },
                requests: {
                    count: {
                        60: new Refreshing(async () => JSON.parse(await (await fetch(`${this.baseUrl}/api/requests/count/60/1`)).text()), 1000 * 60 * 1),
                        day: new Refreshing(async () => JSON.parse(await (await fetch(`${this.baseUrl}/api/requests/count/1440/30`)).text()), 1000 * 60 * 1)
                    }
                },
                //pageviews: new Refreshing(async () => await api.analytics.count("navigate", "pageview"), 5000),
                queries: {
                    long: new Refreshing(async () => JSON.parse(await (await fetch(`${this.baseUrl}/api/aggregate/${JSON.stringify([{$match:{c:"db",e:"aggregate",d:{$gt:(Date.now()-1000*60*60)}}},{$sort:{elp:-1}},{$limit:10}])}`)).text()), 5000),
                },
                events: {
                    count: {
                        60: new Refreshing(async () => JSON.parse(await (await fetch(`${this.baseUrl}/api/events/60/1`)).text()), 5000),
                        day: new Refreshing(async () => JSON.parse(await (await fetch(`${this.baseUrl}/api/events/1440/60`)).text()), 5000)
                    }
                },
            }
        },
        methods: {
            getMax(data) {
                if (!data) return 0;
                return Math.max(...data);
            },
            getAverage(data) {
                if (!data) return 0;
                return Math.round(data.reduce((a, b) => a + b, 0) / data.length);
            }
        }
    };
    </script>
    
    <style scoped>
    .app {
      height: 100vh;
      overflow-x: hidden;
      overflow-y: scroll;
    }
    
    .bars {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    .bar {
        display: flex;
        margin: auto;
        width: min-content;
        gap: 1rem;
    }
    </style>
    