/**
 * Settings Controller
 * Re-exports settings controller from provider-router
 */

export {
  getAllSettings,
  getSetting,
  updateSetting,
  bulkUpdateSettings,
  deleteSetting
} from '../../../provider-router/src/controllers/settings-controller.js'
