import { generatedQuestions, questions } from "../uploads/dummyData.js";

export const processSuggestion = async (reqObject) => {
    let {searchString} = reqObject;
    let questionStore = [...generatedQuestions, ...questions];
    let responseData = questionStore.filter(fruit => fruit.includes(searchString));
    
    responseData = responseData.slice(0, 5);
    return responseData;
}
