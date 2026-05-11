export const sendSuccess = (res, data = {}, message = 'Success', status = 200) => {
  res.status(status).json({ success: true, message, data });
};

export const sendError = (res, message = 'Error', status = 400) => {
  res.status(status).json({ success: false, message });
};
