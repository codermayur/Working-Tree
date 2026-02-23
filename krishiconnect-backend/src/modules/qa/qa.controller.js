const qaService = require('./qa.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const createQuestion = asyncHandler(async (req, res) => {
  const question = await qaService.createQuestion(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, question, 'Question posted successfully'));
});

const getQuestions = asyncHandler(async (req, res) => {
  const result = await qaService.getQuestions(req.query);
  res.status(200).json(
    new ApiResponse(200, result.data, 'Questions fetched successfully', {
      pagination: result.pagination,
    })
  );
});

const getQuestionById = asyncHandler(async (req, res) => {
  const question = await qaService.getQuestionById(req.params.questionId);
  res.status(200).json(new ApiResponse(200, question, 'Question fetched successfully'));
});

const addAnswer = asyncHandler(async (req, res) => {
  const answer = await qaService.addAnswer(
    req.params.questionId,
    req.user._id,
    req.body.content
  );
  res.status(201).json(new ApiResponse(201, answer, 'Answer added successfully'));
});

const getAnswers = asyncHandler(async (req, res) => {
  const result = await qaService.getAnswers(req.params.questionId, req.query);
  res.status(200).json(
    new ApiResponse(200, result.data, 'Answers fetched successfully', {
      pagination: result.pagination,
    })
  );
});

module.exports = {
  createQuestion,
  getQuestions,
  getQuestionById,
  addAnswer,
  getAnswers,
};
