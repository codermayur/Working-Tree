const Question = require('./models/question.model');
const Answer = require('./models/answer.model');
const ApiError = require('../../utils/ApiError');
const Pagination = require('../../utils/pagination');

const questionPagination = new Pagination(Question);
const answerPagination = new Pagination(Answer);

const createQuestion = async (authorId, data) => {
  const question = await Question.create({ author: authorId, ...data });
  await require('../user/user.model').findByIdAndUpdate(authorId, {
    $inc: { 'stats.questionsAsked': 1 },
  });
  return question.populate('author', 'name avatar isExpert');
};

const getQuestions = async (options = {}) => {
  const { category, status = 'open', sort = 'recent', page = 1, limit = 20 } = options;
  const query = { isDeleted: false };
  if (category) query.category = category;
  if (status) query.status = status;

  const sortOpt = sort === 'popular' ? { answersCount: -1, createdAt: -1 } : { createdAt: -1 };

  return questionPagination.paginate(query, {
    page,
    limit,
    sort: sortOpt,
    populate: [{ path: 'author', select: 'name avatar isExpert' }],
  });
};

const getQuestionById = async (questionId) => {
  const question = await Question.findById(questionId)
    .populate('author', 'name avatar isExpert')
    .lean();
  if (!question) throw new ApiError(404, 'Question not found');
  await Question.findByIdAndUpdate(questionId, { $inc: { views: 1 } });
  return question;
};

const addAnswer = async (questionId, authorId, content) => {
  const question = await Question.findById(questionId);
  if (!question) throw new ApiError(404, 'Question not found');
  if (question.status === 'solved') throw new ApiError(400, 'Question already solved');

  const user = await require('../user/user.model').findById(authorId);
  const answer = await Answer.create({
    question: questionId,
    author: authorId,
    content,
    isExpertAnswer: user?.isExpert || false,
  });

  await Question.findByIdAndUpdate(questionId, { $inc: { answersCount: 1 } });
  await require('../user/user.model').findByIdAndUpdate(authorId, {
    $inc: { 'stats.answersGiven': 1 },
  });

  return answer.populate('author', 'name avatar isExpert');
};

const getAnswers = async (questionId, options = {}) => {
  const { page = 1, limit = 20 } = options;
  return answerPagination.paginate(
    { question: questionId, isDeleted: false },
    {
      page,
      limit,
      sort: { voteScore: -1, createdAt: -1 },
      populate: [{ path: 'author', select: 'name avatar isExpert' }],
    }
  );
};

module.exports = {
  createQuestion,
  getQuestions,
  getQuestionById,
  addAnswer,
  getAnswers,
};
