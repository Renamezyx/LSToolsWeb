import { createRouter, createWebHistory } from 'vue-router'
import Index from '../views/index.vue'
import TrendsStats from '../views/trends_stats.vue'
import PushStream from '../views/push_stream.vue'
import ScriptManager from '../views/script_manager.vue'
import OnlineCurl from '../views/online_curl.vue'

const routes = [
  {
    path: '/',
    name: '/',
    component: Index
  },
  {
    path: '/index',
    name: 'Index',
    component: Index
  },
  {
    path: '/trends_stats',
    name: 'TrendsStats',
    component: TrendsStats
  },
  {
    path: '/push_stream',
    name: 'PushStream',
    component: PushStream
  },
  {
    path: '/script_manager',
    name: 'ScriptManager',
    component: ScriptManager
  },
  {
    path: '/online_curl',
    name: 'OnlineCurl',
    component: OnlineCurl
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
