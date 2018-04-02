const { makeBreakpointsModel } = require('../../../api/makeBreakpointsModel');
const stepToRem = require('../../../api/modularScale/stepToRem');
const { mediaAtrule } = require('../../atrules');
const {
  HAS_FONT_SIZE,
  HAS_TSTEP_FUNCTION_WITH_VALUE,
  ROUND_BRACKETS_AND_TSTEP_FUNCTION,
} = require('../../../constants/regexes');
const { fontSizeDecl } = require('../../decls');
const { isNumeric } = require('../../../helpers');
const { setParentSelector } = require('../../selectors');

/**
 * @example t-ms(12) => 12
 * @param {string} tMsFunctionWithVal t-ms function with value.
 * @return {string} Raw value without t-ms function.
 */
const replaceRoundBracketsAndTStepFunction = tMsFunctionWithVal =>
  tMsFunctionWithVal.replace(ROUND_BRACKETS_AND_TSTEP_FUNCTION, '');

/**
 *
 * @param {Object} decl Css declaration.
 * @param {Object} config User configuration.
 * @return {void}
 */
module.exports = (decl, config) => {
  const { value, parent } = decl;
  const breakpoints = makeBreakpointsModel(config);

  const target = replaceRoundBracketsAndTStepFunction(value);

  breakpoints
    .filter(b => b.value !== '0px')
    .reverse()
    .map(b =>
      parent.after(
        mediaAtrule({
          minWidth: b.value,
          nestedRule: setParentSelector(parent).append(
            fontSizeDecl(stepToRem(target, breakpoints, b.name)),
          ),
        }),
      ),
  );

  const fontSize = stepToRem(target, breakpoints);
  decl.replaceWith(fontSizeDecl(fontSize));
};

/**
 * Does the font-size have a t-ms function? If it contains, check the contents of the function.
 * If the contents is a number, return true, otherwise return false and warn about the user error.
 * @example font-size: t-ms(2) => true.
 * @param {Object} decl Css declaration.
 * @return {boolean}../
 */
module.exports.test = decl => {
  const { prop, value } = decl;
  const hasFontSize = HAS_FONT_SIZE.test(prop);
  const hasTStepFunction = HAS_TSTEP_FUNCTION_WITH_VALUE.test(value);
  let result = null;

  if ((hasFontSize, hasTStepFunction)) {
    const msValue = replaceRoundBracketsAndTStepFunction(value);

    try {
      if (isNumeric(msValue)) {
        result = true;
      } else {
        result = false;
        decl.parent.remove();
        throw new Error(
          `"${msValue}" is incorrect value of t-ms function. Use numbers. For example t-ms(3).`,
        );
      }
    } catch (err) {
      console.warn(err.message);
    }
  }

  return result;
};