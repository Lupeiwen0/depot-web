/**
 * 同构错误码枚举
 * 客户端和服务端共享使用
 * 与 messages/*.json 中的 api.* 命名空间对应
 */

export const ErrorCodes = {
  // ============ 认证错误 ============
  AUTH_NOT_LOGGED_IN: "api.auth.notLoggedIn",
  AUTH_UNAUTHORIZED: "api.auth.unauthorized",
  AUTH_FORBIDDEN: "api.auth.forbidden",
  AUTH_ADMIN_REQUIRED: "api.auth.adminRequired",
  AUTH_INVALID_CREDENTIALS: "api.auth.invalidCredentials",
  AUTH_PASSWORD_REQUIRED: "api.auth.passwordRequired",
  AUTH_PASSWORD_TOO_SHORT: "api.auth.passwordTooShort",
  AUTH_ACCOUNT_NOT_SUPPORTED: "api.auth.accountNotSupported",
  AUTH_INCORRECT_PASSWORD: "api.auth.incorrectPassword",
  AUTH_CHANGE_PASSWORD_FAILED: "api.auth.changePasswordFailed",
  AUTH_EMAIL_REQUIRED: "api.auth.emailRequired",
  AUTH_SEND_EMAIL_FAILED: "api.auth.sendEmailFailed",
  AUTH_REQUEST_FAILED: "api.auth.requestFailed",
  AUTH_TOKEN_AND_PASSWORD_REQUIRED: "api.auth.tokenAndPasswordRequired",
  AUTH_INVALID_OR_EXPIRED_TOKEN: "api.auth.invalidOrExpiredToken",
  AUTH_RESET_PASSWORD_FAILED: "api.auth.resetPasswordFailed",

  // ============ 验证错误 ============
  VALIDATION_INVALID_REQUEST: "api.validation.invalidRequest",
  VALIDATION_TITLE_AND_PRICE_REQUIRED: "api.validation.titleAndPriceRequired",
  VALIDATION_NAME_AND_SLUG_REQUIRED: "api.validation.nameAndSlugRequired",
  VALIDATION_INVALID_ID: "api.validation.invalidId",
  VALIDATION_NOT_FOUND: "api.validation.notFound",
  VALIDATION_ALREADY_EXISTS: "api.validation.alreadyExists",
  VALIDATION_INVALID_ROLE: "api.validation.invalidRole",

  // ============ 商品相关 ============
  PRODUCT_TITLE_REQUIRED: "api.product.titleRequired",
  PRODUCT_PRICE_REQUIRED: "api.product.priceRequired",
  PRODUCT_DUPLICATE_TITLE: "api.product.duplicateTitle",
  PRODUCT_NOT_FOUND: "api.product.notFound",
  PRODUCT_CREATE_FAILED: "api.product.createFailed",
  PRODUCT_UPDATE_FAILED: "api.product.updateFailed",
  PRODUCT_DELETE_FAILED: "api.product.deleteFailed",
  PRODUCT_GET_FAILED: "api.product.getFailed",
  PRODUCT_IN_CART_CANNOT_DELETE: "api.product.inCartCannotDelete",
  PRODUCT_TOGGLE_STATUS_FAILED: "api.product.toggleStatusFailed",

  // ============ 购物车相关 ============
  CART_ADD_FAILED: "api.cart.addFailed",
  CART_UPDATE_FAILED: "api.cart.updateFailed",
  CART_REMOVE_FAILED: "api.cart.removeFailed",

  // ============ 标签相关 ============
  TAG_NAME_REQUIRED: "api.tag.nameRequired",
  TAG_SLUG_REQUIRED: "api.tag.slugRequired",
  TAG_DUPLICATE_NAME: "api.tag.duplicateName",
  TAG_DUPLICATE_SLUG: "api.tag.duplicateSlug",
  TAG_NOT_FOUND: "api.tag.notFound",
  TAG_CREATE_FAILED: "api.tag.createFailed",
  TAG_UPDATE_FAILED: "api.tag.updateFailed",
  TAG_DELETE_FAILED: "api.tag.deleteFailed",
  TAG_GET_FAILED: "api.tag.getFailed",

  // ============ 用户相关 ============
  USER_NOT_FOUND: "api.user.notFound",
  USER_UPDATE_FAILED: "api.user.updateFailed",
  USER_DELETE_FAILED: "api.user.deleteFailed",
  USER_CANNOT_MODIFY_OWN_ROLE: "api.user.cannotModifyOwnRole",
  USER_GET_FAILED: "api.user.getFailed",

  // ============ 订单相关 ============
  ORDER_NOT_FOUND: "api.order.notFound",
  ORDER_CREATE_FAILED: "api.order.createFailed",
  ORDER_UPDATE_FAILED: "api.order.updateFailed",
  ORDER_DELETE_FAILED: "api.order.deleteFailed",
  ORDER_GET_FAILED: "api.order.getFailed",
  ORDER_CART_EMPTY: "api.order.cartEmpty",

  // ============ 结账相关 ============
  CHECKOUT_GET_FAILED: "api.checkout.getFailed",

  // ============ 上传相关 ============
  UPLOAD_NO_FILE: "api.upload.noFile",
  UPLOAD_INVALID_FORMAT: "api.upload.invalidFormat",
  UPLOAD_FILE_TOO_LARGE: "api.upload.fileTooLarge",
  UPLOAD_FAILED: "api.upload.uploadFailed",

  // ============ 通用错误 ============
  COMMON_SUCCESS: "api.common.success",
  COMMON_NETWORK_ERROR: "api.common.networkError",
  COMMON_UNKNOWN_ERROR: "api.common.unknownError",
  COMMON_OPERATION_FAILED: "api.common.operationFailed",
} as const;

/**
 * 错误码类型
 */
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * 检查一个字符串是否是有效的错误码
 */
export function isErrorCode(code: string): code is ErrorCode {
  return Object.values(ErrorCodes).includes(code as ErrorCode);
}
