import { createRouter, createWebHashHistory } from 'vue-router';

import HÖÐR from '../../pages/HÖÐR/HÖÐR.vue';
import MoMoYouYan from '../../pages/MoMoYouYan/MoMoYouYan.vue';
import MoMoYouYanPost from '../../pages/MoMoYouYan/MoMoYouYanPost.vue';

const routes = [
  {
    path: '/MoMoYouYan',
    name: 'MoMoYouYan',
    component: MoMoYouYan,
    alias: ['/MoMoYouYan.html'],
    meta: { title: 'YUYAN - MoMoYouYan' },
  },
  {
    path: '/MoMoYouYanPost',
    name: 'MoMoYouYanPost',
    component: MoMoYouYanPost,
    alias: ['/post'],
    props: true,
    meta: { title: 'YUYAN - MoMoYouYan Post' },
  },
  {
    path: '/HODR',
    name: 'HÖÐR',
    component: HÖÐR,
    alias: ['/HÖÐR.html', '/hodr', '/hodr.html'],
    meta: { title: 'YUYAN - HÖÐR' },
  },
  {
    path: '/JianYan.html',
    name: 'JianYan',
    component: MoMoYouYan,
    meta: { title: 'YUYAN - JianYan' },
  },
  { path: '/', redirect: '/MoMoYouYan' },
];

const router = createRouter({
  // history: createWebHistory(import.meta.env.BASE_URL),
  history: createWebHashHistory(),
  routes,
});

router.afterEach((to) => {
  document.title = to.meta.title || 'YUYAN';
});

export default router;
