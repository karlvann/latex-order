export default defineNuxtRouteMiddleware(async () => {
  const user = useDirectusUser()

  if (!user.value) {
    return navigateTo('/')
  }
})
