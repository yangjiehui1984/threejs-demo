import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Game from '../components/Game.vue'
import Jump from '../components/Jump.vue'
import Particles from '../components/Particles.vue'
import Model from '../components/Model.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Home',
    component: Game
  },
  {
    path: '/jump',
    name: 'Jump',
    component: Jump
  },
  {
    path: '/particles',
    name: 'Particles',
    component: Particles
  },
  {
    path: '/model',
    name: 'Model',
    component: Model
  }
  // {
  //   path: '/about',
  //   name: 'About',
  //   // route level code-splitting
  //   // this generates a separate chunk (about.[hash].js) for this route
  //   // which is lazy-loaded when the route is visited.
  //   component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  // }
]

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
})

export default router
