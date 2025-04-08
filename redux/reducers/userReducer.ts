const initialState = {
    wishList: [],
    progress: []
};

const userReducer = (state = initialState, action: any) => {
    switch (action.type) {
        case 'PUSH_WISH_COURSE':
            return {
                ...state,
                wishList: [...state.wishList, action.payload]
            };
        case 'REMOVE_WISH_COURSE':
            return {
                ...state,
                wishList: state.wishList.filter((item: any) => item._id !== action.payload._id)
            };
        case 'SAVE_WISH_LIST':
            return {
                ...state,
                wishList: [...action.payload]
            };
        default:
            return state;
    }
};

export default userReducer; 