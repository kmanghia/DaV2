export const userActions = {
    pushWishCourse: (data: any) => ({
        type: 'PUSH_WISH_COURSE',
        payload: data
    }),
    removeWishCourse: (data: any) => ({
        type: 'REMOVE_WISH_COURSE',
        payload: data
    }),
    saveWishList: (data: any) => ({
        type: 'SAVE_WISH_LIST',
        payload: data
    })
}; 